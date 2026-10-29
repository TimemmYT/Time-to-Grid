# TIME TO GRID v1.0.0

Grilles de composition + safe zones réseaux sociaux, directement dans After Effects et Premiere Pro. Noir et blanc, zéro friction.

## Installation Mac

### 1. Activer le mode debug CEP (une seule fois)

Ouvre le Terminal et colle ces lignes (couvre CEP 9 à 12) :

```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
killall cfprefsd
```

### 2. Copier le dossier

Copie le dossier `TimeToGrid` complet dans :

```
~/Library/Application Support/Adobe/CEP/extensions/
```

Pour y accéder : Finder > menu Aller > Aller au dossier (Cmd+Shift+G) et colle le chemin ci-dessus. Crée le dossier `extensions` s'il n'existe pas.

Commande rapide qui fait tout (si le zip est dans Téléchargements et déjà dézippé) :

```bash
mkdir -p ~/Library/"Application Support"/Adobe/CEP/extensions
cp -R ~/Downloads/TimeToGrid ~/Library/"Application Support"/Adobe/CEP/extensions/
```

### 3. Lancer

## Installation Windows

### 1. Activer le mode debug CEP (une seule fois)

Ouvre PowerShell et colle ces lignes (couvre CEP 9 à 12) :

```powershell
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.9" -Name PlayerDebugMode -Value 1 -PropertyType String -Force
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.10" -Name PlayerDebugMode -Value 1 -PropertyType String -Force
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name PlayerDebugMode -Value 1 -PropertyType String -Force
New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.12" -Name PlayerDebugMode -Value 1 -PropertyType String -Force
```

### 2. Copier le dossier

Copie le dossier `TimeToGrid` complet dans :

```
C:\Users\<toi>\AppData\Roaming\Adobe\CEP\extensions\
```

(Crée le dossier `extensions` s'il n'existe pas.)

### 3. Lancer

Redémarre AE ou Premiere, puis : **Fenêtre > Extensions > Time to Grid**

## Utilisation

- **PLATEFORME** : Reels, TikTok ou Shorts. Les zones couvertes par l'UI de l'app apparaissent en blanc translucide.
  - **Bordures Insta** : affiche les bandes noires de la zone d'affichage réelle des Reels (hachurées).
  - **Aperçu feed 4:5** : cadre en pointillés du recadrage feed Instagram.
- **GRILLE** : Tiers, Centre, Quarts, Nombre d'or, Diagonales, ou grille perso (jusqu'à 12x12).
- **APPLIQUER** : pose la grille.
  - Dans **AE** : calque repère vectoriel verrouillé, jamais rendu à l'export. Zéro risque.
  - Dans **Premiere** : PNG transparent généré à la résolution exacte de ta séquence, importé dans le chutier TIME TO GRID et posé sur la piste du haut (une piste est créée si besoin).
- **ON/OFF** : masque/affiche sans rien supprimer (calque désactivé dans AE, piste coupée dans Premiere).
- **X** : efface tout proprement.

## Important avant export (Premiere uniquement)

L'overlay Premiere est un vrai clip : pense à cliquer **X** (ou OFF) avant d'exporter. Dans AE aucun souci, le calque repère ne sort jamais au rendu.

## Fichiers générés

Les PNG Premiere sont stockés dans `Documents\TimeToGrid\`. Tu peux vider ce dossier quand tu veux.
