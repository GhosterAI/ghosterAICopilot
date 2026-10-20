; GhosterAI 3.3.5 — Windows x64 installer
; Build with: "C:\Users\<user>\AppData\Local\Programs\Inno Setup 6\ISCC.exe" installer\GhosterAI.iss

#define MyAppName "GhosterAI"
#define MyAppVersion "3.3.5"
#define MyAppPublisher "GhosterAI"
#define MyAppURL "https://github.com/GhosterAI/ghosterAICopilot"
#define MyAppExeName "GhosterAI.exe"

[Setup]
AppId={{8D7F3F0A-6C2B-4A4E-9E3B-3B6C5A1F2D77}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases
DefaultDirName={autopf}\GhosterAI
DefaultGroupName=GhosterAI
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE-APP
OutputDir=..\dist
OutputBaseFilename=GhosterAI-3.3.5-win64-setup
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes
RestartApplications=no
UsePreviousAppDir=yes
AllowNoIcons=yes
SetupLogging=yes
VersionInfoVersion=3.3.5.0
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} local build installer
VersionInfoCopyright=Copyright (c) 2026 GhosterAI

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать ярлык на рабочем столе"; GroupDescription: "Дополнительно:"; Flags: unchecked

[Files]
Source: "..\build\GhosterAI-patched.exe"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
Source: "..\build\ffmpeg\*"; DestDir: "{app}\ffmpeg"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE-APP"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\NOTICE"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\FFMPEG_SOURCE_OFFER.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docs\*"; DestDir: "{app}\docs"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\GhosterAI"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\GhosterAI"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Запустить GhosterAI"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Do not delete the user's WebView2 profile, keys or chat history automatically.
Type: files; Name: "{app}\*.log"
