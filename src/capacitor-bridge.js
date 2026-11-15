
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';

// Conversion Blob PDF vers Base64.
const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    const result = String(reader.result);
    resolve(result.split(',')[1]);
  };

  reader.onerror = () => reject(
    new Error('Impossible de lire le reçu PDF.')
  );

  reader.readAsDataURL(blob);
});

// Nettoyage du nom du fichier.
const safeFileName = (name) => {
  let result = String(name || 'recu-couturepro.pdf')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!result.toLowerCase().endsWith('.pdf')) {
    result += '.pdf';
  }

  return result;
};

// Pont natif CouturePro.
window.CoutureProNative = {

  isNative,

  // Ouverture sécurisée des paiements.
  openExternal: async (url) => {
    if (!/^https:\/\//i.test(String(url))) {
      throw new Error('URL externe non sécurisée.');
    }

    if (isNative) {
      return Browser.open({
        url: String(url),
        presentationStyle: 'popover'
      });
    }

    window.location.assign(String(url));
  },

  // Enregistrement du reçu PDF.
  savePdf: async (pdfBlob, fileName = 'recu-couturepro.pdf') => {

    if (!(pdfBlob instanceof Blob)) {
      throw new Error('Le document PDF est invalide.');
    }

    if (!isNative || !isAndroid) {
      throw new Error(
        'Cette fonction nécessite la version Android de CouturePro.'
      );
    }

    const pdfName = safeFileName(fileName);
    const base64 = await blobToBase64(pdfBlob);

    // Android 7 à 9 : vérifier la permission de stockage.
    const androidVersionMatch =
      navigator.userAgent.match(/Android\s([0-9.]+)/i);

    const androidVersion = androidVersionMatch
      ? parseFloat(androidVersionMatch[1])
      : null;

    if (androidVersion !== null && androidVersion < 10) {
      const permissions = await Filesystem.checkPermissions();

      if (permissions.publicStorage !== 'granted') {
        const requested = await Filesystem.requestPermissions();

        if (requested.publicStorage !== 'granted') {
          throw new Error(
            'Permission de stockage refusée. Autorise l’accès aux fichiers dans les paramètres Android.'
          );
        }
      }
    }

    // Enregistrement dans le dossier Documents de l'application.
    const result = await Filesystem.writeFile({
      path: `CouturePro/${pdfName}`,
      data: base64,
      directory: Directory.Documents,
      recursive: true
    });

    return {
      success: true,
      uri: result.uri,
      fileName: pdfName,
      message: 'Reçu PDF enregistré.'
    };
  },

  // Partage du reçu PDF enregistré.
  sharePdf: async (uri, fileName = 'Reçu CouturePro') => {

    if (!isNative || !uri) {
      throw new Error('Fichier PDF introuvable.');
    }

    return Share.share({
      title: fileName,
      text: 'Voici votre reçu de réparation CouturePro.',
      url: uri,
      dialogTitle: 'Partager le reçu'
    });
  }
};

// Gestion des liens profonds et du retour de paiement.
if (isNative) {

  const dispatchAppUrl = (url) => {
    if (!url) return;

    window.dispatchEvent(
      new CustomEvent('couturepro:app-url-open', {
        detail: { url }
      })
    );
  };

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      window.dispatchEvent(
        new Event('couturepro:app-resumed')
      );
    }
  });

  App.addListener('appUrlOpen', ({ url }) => {
    dispatchAppUrl(url);
  });

  App.getLaunchUrl()
    .then(({ url }) => {
      dispatchAppUrl(url);
    })
    .catch((error) => {
      console.warn(
        'Lecture du lien de démarrage CouturePro impossible :',
        error
      );
    })
    .finally(() => {
      window.__coutureProBridgeReady?.();
    });

} else {
  window.__coutureProBridgeReady?.();
}
