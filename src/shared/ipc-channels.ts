export const IpcChannels = {
  SelectFolder: 'dialog:select-folder',
  ListDrives: 'dialog:list-drives',
  GetSettings: 'settings:get',
  UpdateSettings: 'settings:update',
  ScanRun: 'scan:run',
  ScanProgress: 'scan:progress',
  ScanCancel: 'scan:cancel',
  DeleteCandidates: 'cleanup:delete',
  WindowMinimize: 'window:minimize',
  WindowClose: 'window:close',
  OpenSettingsWindow: 'window:open-settings',
  LogsGet: 'logs:get',
  LogsClear: 'logs:clear',
  LogsReport: 'logs:report',
  LogsEntry: 'logs:entry'
} as const
