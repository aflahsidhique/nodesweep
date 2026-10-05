; Custom NSIS pages for the NodeSweep installer (picked up automatically by electron-builder).

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to the ${PRODUCT_NAME} Setup Wizard"
  !define MUI_WELCOMEPAGE_TITLE_3LINES
  !define MUI_WELCOMEPAGE_TEXT "This wizard will install ${PRODUCT_NAME} on your computer.$\r$\n$\r$\n${PRODUCT_NAME} finds node_modules folders in projects you haven't touched in a while and helps you safely reclaim the disk space they use.$\r$\n$\r$\nClick Next to continue, or Cancel to exit Setup."
  !insertmacro MUI_PAGE_WELCOME
!macroend
