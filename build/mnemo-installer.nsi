; MNEMO — instalador do Windows (NSIS)
Unicode true
!include "MUI2.nsh"
!define APP "MNEMO"
!define VER "1.0.0"
!define SRC "..\dist\win-unpacked"
Name "${APP}"
OutFile "..\dist\MNEMO-${VER}-Instalador.exe"
InstallDir "$LOCALAPPDATA\Programs\${APP}"
InstallDirRegKey HKCU "Software\${APP}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "MNEMO — o roguelike da memória"
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "Instalador do MNEMO"
VIAddVersionKey "FileVersion" "${VER}"
VIAddVersionKey "LegalCopyright" "MNEMO"

!define MUI_ICON "..\assets\icon.ico"
!define MUI_UNICON "..\assets\icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao MNEMO!"
!define MUI_WELCOMEPAGE_TEXT "O roguelike da memória.$\r$\n$\r$\nVire cartas, forme pares, encadeie combos, colecione relíquias e derrote os chefes dos 8 Círculos.$\r$\n$\r$\nClique em Avançar para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\MNEMO.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Jogar MNEMO agora"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"

Section "Jogo" SEC01
  SetOutPath "$INSTDIR"
  nsExec::Exec 'taskkill /F /IM MNEMO.exe'
  File /r "${SRC}\*.*"
  File "..\assets\icon.ico"
  WriteUninstaller "$INSTDIR\Desinstalar MNEMO.exe"
  CreateDirectory "$SMPROGRAMS\${APP}"
  CreateShortcut "$SMPROGRAMS\${APP}\${APP}.lnk" "$INSTDIR\MNEMO.exe" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\${APP}\Desinstalar ${APP}.lnk" "$INSTDIR\Desinstalar MNEMO.exe"
  CreateShortcut "$DESKTOP\${APP}.lnk" "$INSTDIR\MNEMO.exe" "" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\${APP}" "InstallDir" "$INSTDIR"
  !define UK "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"
  WriteRegStr HKCU "${UK}" "DisplayName" "${APP}"
  WriteRegStr HKCU "${UK}" "DisplayVersion" "${VER}"
  WriteRegStr HKCU "${UK}" "Publisher" "MNEMO"
  WriteRegStr HKCU "${UK}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UK}" "UninstallString" '"$INSTDIR\Desinstalar MNEMO.exe"'
  WriteRegDWORD HKCU "${UK}" "NoModify" 1
  WriteRegDWORD HKCU "${UK}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM MNEMO.exe'
  Delete "$DESKTOP\${APP}.lnk"
  RMDir /r "$SMPROGRAMS\${APP}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP}"
  DeleteRegKey HKCU "Software\${APP}"
SectionEnd
