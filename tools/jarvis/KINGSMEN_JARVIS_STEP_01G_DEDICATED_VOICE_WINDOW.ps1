param(
  [switch]$Worker
)

# KINGSMEN JARVIS STEP 01G - DEDICATED VOICE WINDOW
# Runtime-only. No layout files are changed.
# Purpose:
# - Open a visible dedicated Jarvis voice window.
# - Keep Windows Speech Recognition alive permanently until the Commander closes the window.
# - Record proof of SPEECH DETECTED, RECOGNIZED, WAKE ROUTE ACTIVE, API POST OK, and SPOKEN.
# - Preserve the locked Jarvis layout.

$ErrorActionPreference = "Stop"

function EnsureDir($Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function WriteNoBom($Path, $Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
}

function AppendLog($Path, $Text) {
  EnsureDir (Split-Path -Parent $Path)
  Add-Content -Path $Path -Value $Text -Encoding UTF8
}

function NowIso() {
  return (Get-Date).ToUniversalTime().ToString("o")
}

function Stamp() {
  return Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) {
  $Repo = (Get-Location).Path
}

if (!(Test-Path (Join-Path $Repo "apps\web"))) {
  throw "Kingsmen web repo not found. Expected C:\Kingsmen\kingsmen-platform\apps\web"
}

$RuntimeDir = Join-Path $Repo "reports\jarvis\runtime"
$StepsDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
EnsureDir $RuntimeDir
EnsureDir $StepsDir
EnsureDir $DocsDir
EnsureDir $ToolsDir

$ToolPath = Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01G_DEDICATED_VOICE_WINDOW.ps1"
$CmdPath = "C:\Kingsmen\JARVIS_STEP_01G_DEDICATED_VOICE_WINDOW.cmd"
$StartPath = "C:\Kingsmen\START_JARVIS_VOICE_WINDOW.cmd"

$LogPath = Join-Path $RuntimeDir "STEP_01G_DEDICATED_VOICE_WINDOW.log"
$StatePath = Join-Path $RuntimeDir "STEP_01G_DEDICATED_VOICE_WINDOW_STATE.json"
$EventsPath = Join-Path $RuntimeDir "STEP_01G_DEDICATED_VOICE_WINDOW_EVENTS.jsonl"
$ProofPath = Join-Path $StepsDir "STEP_01G_DEDICATED_VOICE_WINDOW_PROOF.json"
$LedgerPath = Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md"

$ApiUrl = "http://127.0.0.1:3000/api/jarvis/voice"
$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
$JarvisUrl = "http://127.0.0.1:3000/jarvis"

$WakeGreeting = "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine."

if (!$Worker) {
  Clear-Host
  Write-Host "===============================================================" -ForegroundColor Cyan
  Write-Host " KINGSMEN JARVIS STEP 01G - DEDICATED VOICE WINDOW" -ForegroundColor Cyan
  Write-Host "===============================================================" -ForegroundColor Cyan
  Write-Host "Runtime-only. No visual/layout files are changed." -ForegroundColor Yellow
  Write-Host "This opens a separate Jarvis voice window and keeps it alive." -ForegroundColor Yellow
  Write-Host ""

  if ($PSCommandPath -and ((Resolve-Path $PSCommandPath).Path -ne $ToolPath)) {
    Copy-Item $PSCommandPath $ToolPath -Force
    Write-Host "WROTE: tools\jarvis\KINGSMEN_JARVIS_STEP_01G_DEDICATED_VOICE_WINDOW.ps1" -ForegroundColor Green
  } elseif (!(Test-Path $ToolPath)) {
    Copy-Item $MyInvocation.MyCommand.Path $ToolPath -Force
    Write-Host "WROTE: tools\jarvis\KINGSMEN_JARVIS_STEP_01G_DEDICATED_VOICE_WINDOW.ps1" -ForegroundColor Green
  }

  $CmdLines = @(
    "@echo off",
    "title KINGSMEN JARVIS STEP 01G DEDICATED VOICE WINDOW",
    "powershell -ExecutionPolicy Bypass -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01G_DEDICATED_VOICE_WINDOW.ps1"""
  )
  [System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)
  [System.IO.File]::WriteAllLines($StartPath, $CmdLines, [System.Text.Encoding]::ASCII)
  Write-Host ("WROTE: " + $CmdPath) -ForegroundColor Green
  Write-Host ("WROTE: " + $StartPath) -ForegroundColor Green

  try {
    Start-Process $JarvisUrl | Out-Null
    Write-Host ("OPENED: " + $JarvisUrl) -ForegroundColor Green
  } catch {
    Write-Host ("Browser open warning: " + $_.Exception.Message) -ForegroundColor Yellow
  }

  $argsList = @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-File", $ToolPath,
    "-Worker"
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList $argsList -WindowStyle Normal | Out-Null

  Write-Host ""
  Write-Host "VOICE WINDOW LAUNCHED." -ForegroundColor Green
  Write-Host "Look for the new window titled: KINGSMEN JARVIS VOICE WINDOW - STEP 01G" -ForegroundColor Yellow
  Write-Host "In that new window, say clearly: Jarvis" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Proof files:" -ForegroundColor Cyan
  Write-Host $LogPath
  Write-Host $StatePath
  Write-Host $ProofPath
  return
}

# Worker mode starts here.
try { $host.UI.RawUI.WindowTitle = "KINGSMEN JARVIS VOICE WINDOW - STEP 01G" } catch {}

$script:State = [ordered]@{
  step = "STEP_01G_DEDICATED_VOICE_WINDOW"
  status = "starting"
  updated_at = NowIso
  recognizer_started = $false
  recognizer_culture = ""
  total_speech_detected = 0
  total_hypothesized = 0
  total_recognized = 0
  total_rejected = 0
  total_wake = 0
  total_api_posts = 0
  total_spoken = 0
  last_text = ""
  last_confidence = $null
  last_event = ""
  api = $ApiUrl
  jarvis_url = $JarvisUrl
  log = $LogPath
  events = $EventsPath
  dedicated_window_alive = $false
  layout_files_changed = $false
}

function SaveState() {
  $script:State.updated_at = NowIso
  WriteNoBom $StatePath ($script:State | ConvertTo-Json -Depth 12)
}

function Log($Message) {
  $line = "[" + (Stamp) + "] " + $Message
  AppendLog $LogPath $line
  Write-Host $line
  $script:State.last_event = $Message
  SaveState
}

function Event($Type, $Text, $Extra) {
  $obj = [ordered]@{
    ts = NowIso
    type = $Type
    text = $Text
    extra = $Extra
  }
  AppendLog $EventsPath ($obj | ConvertTo-Json -Compress -Depth 12)
}

function Speak($Text) {
  try {
    $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $speaker.Rate = -1
    $speaker.Volume = 100
    $speaker.Speak($Text)
    $speaker.Dispose()
    $script:State.total_spoken = [int]$script:State.total_spoken + 1
    SaveState
    Event "spoken" $Text @{}
    Log ("SPOKEN: " + $Text)
  } catch {
    Event "speak-error" $_.Exception.Message @{}
    Log ("SPEAK FAILED: " + $_.Exception.Message)
  }
}

function IsWake($Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
  $clean = $Text.ToLowerInvariant()
  if ($clean.Contains("jarvis")) { return $true }
  if ($clean.Contains("jervis")) { return $true }
  if ($clean.Contains("javis")) { return $true }
  if ($clean.Contains("jarv")) { return $true }
  return $false
}

function PostVoice($Text) {
  try {
    $body = @{
      text = $Text
      command = $Text
      source = "step-01g-dedicated-native-voice-window"
      step = "STEP_01G_DEDICATED_VOICE_WINDOW"
      commander_only = $true
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec 8
    $script:State.total_api_posts = [int]$script:State.total_api_posts + 1
    SaveState

    $reply = $null
    if ($response.reply) { $reply = [string]$response.reply }
    elseif ($response.message) { $reply = [string]$response.message }
    elseif ($response.output) { $reply = [string]$response.output }

    if ([string]::IsNullOrWhiteSpace($reply)) {
      $reply = $WakeGreeting
    }

    Event "api-post-ok" $Text @{ reply = $reply }
    Log "API POST OK"
    Speak $reply
  } catch {
    Event "api-post-failed" $Text @{ error = $_.Exception.Message }
    Log ("API POST FAILED: " + $_.Exception.Message)
    Speak $WakeGreeting
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS DEDICATED VOICE WINDOW - STEP 01G" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This window must stay open. It is the native Windows voice bridge." -ForegroundColor Yellow
Write-Host "Say clearly: Jarvis" -ForegroundColor Yellow
Write-Host "Close this window only after proof is captured." -ForegroundColor Yellow
Write-Host ""

WriteNoBom $LogPath ""
WriteNoBom $EventsPath ""
SaveState

$script:State.status = "starting"
SaveState
Log "STEP 01G worker starting."
Event "worker-start" "Dedicated Jarvis voice window started." @{}

try {
  Add-Type -AssemblyName System.Speech
  Log "System.Speech loaded."
} catch {
  Log ("System.Speech load failed: " + $_.Exception.Message)
  throw
}

try {
  Invoke-RestMethod -Uri $StatusUrl -Method Get -TimeoutSec 4 | Out-Null
  Log "Jarvis API detected on port 3000."
  Event "api-status-ok" "Jarvis API detected on port 3000." @{}
} catch {
  Log ("Jarvis API not detected. Voice will still prove microphone and speak fallback. " + $_.Exception.Message)
  Event "api-status-failed" "Jarvis API not detected." @{ error = $_.Exception.Message }
}

$engine = $null

try {
  $installed = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
  $chosen = $null

  foreach ($cultureName in @("en-ZA", "en-US", "en-GB")) {
    foreach ($info in $installed) {
      if ($info.Culture.Name -eq $cultureName) {
        $chosen = $info
        break
      }
    }
    if ($chosen) { break }
  }

  if ($chosen) {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine($chosen)
  } else {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  }

  $script:State.recognizer_culture = $engine.RecognizerInfo.Culture.Name
  Log ("RECOGNIZER READY: " + $engine.RecognizerInfo.Culture.Name)

  $choices = New-Object System.Speech.Recognition.Choices
  @(
    "Jarvis",
    "Hey Jarvis",
    "Good morning Jarvis",
    "Good evening Jarvis",
    "Jarvis status",
    "Jarvis what is your status",
    "Jarvis welcome me to Kingsmen Command",
    "Jarvis give me a command brief",
    "Jarvis inspect Kingsmen"
  ) | ForEach-Object { [void]$choices.Add($_) }

  $gb = New-Object System.Speech.Recognition.GrammarBuilder
  $gb.Culture = $engine.RecognizerInfo.Culture
  $gb.Append($choices)
  $wakeGrammar = New-Object System.Speech.Recognition.Grammar($gb)
  $wakeGrammar.Name = "Kingsmen Wake Grammar"
  $engine.LoadGrammar($wakeGrammar)

  $dictation = New-Object System.Speech.Recognition.DictationGrammar
  $dictation.Name = "Kingsmen Dictation Grammar"
  $engine.LoadGrammar($dictation)

  $engine.SetInputToDefaultAudioDevice()

  $engine.add_SpeechDetected({
    $script:State.total_speech_detected = [int]$script:State.total_speech_detected + 1
    $script:State.status = "speech_detected"
    SaveState
    Event "speech-detected" "Windows detected sound through the default microphone." @{}
    Log "SPEECH DETECTED"
  })

  $engine.add_SpeechHypothesized({
    param($sender, $eventArgs)
    $txt = [string]$eventArgs.Result.Text
    $script:State.total_hypothesized = [int]$script:State.total_hypothesized + 1
    $script:State.last_text = $txt
    $script:State.status = "hypothesized"
    SaveState
    Event "speech-hypothesized" $txt @{ confidence = $eventArgs.Result.Confidence }
    Log ("HYPOTHESIZED: " + $txt)
  })

  $engine.add_SpeechRecognitionRejected({
    $script:State.total_rejected = [int]$script:State.total_rejected + 1
    $script:State.status = "speech_rejected"
    SaveState
    Event "recognition-rejected" "Speech heard but not recognized confidently." @{}
    Log "RECOGNITION REJECTED"
  })

  $engine.add_SpeechRecognized({
    param($sender, $eventArgs)

    $txt = [string]$eventArgs.Result.Text
    $conf = [double]$eventArgs.Result.Confidence

    $script:State.total_recognized = [int]$script:State.total_recognized + 1
    $script:State.last_text = $txt
    $script:State.last_confidence = $conf
    $script:State.status = "recognized"
    SaveState

    Event "recognized" $txt @{ confidence = $conf }
    Log ("RECOGNIZED: " + $txt + " | confidence=" + $conf)

    if (IsWake $txt) {
      $script:State.total_wake = [int]$script:State.total_wake + 1
      $script:State.status = "wake_route_active"
      SaveState
      Event "wake-route-active" $txt @{ confidence = $conf }
      Log "WAKE ROUTE ACTIVE"
      PostVoice $txt
    }
  })

  $engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)

  $script:State.recognizer_started = $true
  $script:State.status = "listening"
  $script:State.dedicated_window_alive = $true
  SaveState

  Event "listening" "Dedicated voice window is listening." @{}
  Log "DEDICATED VOICE WINDOW ACTIVE. SAY: JARVIS"
  Log "This window will not return to a PowerShell prompt. Close the window to stop."

  $lastHeartbeat = Get-Date
  while ($true) {
    Start-Sleep -Seconds 1
    $now = Get-Date
    if (($now - $lastHeartbeat).TotalSeconds -ge 15) {
      $lastHeartbeat = $now
      Event "voice-window-heartbeat" "Still listening." @{}
      Log "STILL LISTENING - say Jarvis. Close this window to stop."
    }
  }
}
finally {
  if ($engine -ne $null) {
    try { $engine.RecognizeAsyncCancel() } catch {}
    try { $engine.RecognizeAsyncStop() } catch {}
    try { $engine.Dispose() } catch {}
  }

  $script:State.dedicated_window_alive = $false
  if ($script:State.total_wake -gt 0) {
    $script:State.status = "complete_wake_proven"
  } elseif ($script:State.total_recognized -gt 0) {
    $script:State.status = "complete_recognition_proven_no_wake"
  } elseif ($script:State.total_speech_detected -gt 0) {
    $script:State.status = "complete_speech_detected_no_recognition"
  } else {
    $script:State.status = "stopped_no_speech_detected"
  }
  SaveState

  $proof = [ordered]@{
    step = "STEP_01G_DEDICATED_VOICE_WINDOW"
    status = $script:State.status
    created_at = NowIso
    repo = $Repo
    no_visual_files_changed = $true
    purpose = "Dedicated visible voice window that keeps Windows Speech Recognition alive."
    totals = [ordered]@{
      speech_detected = $script:State.total_speech_detected
      hypothesized = $script:State.total_hypothesized
      recognized = $script:State.total_recognized
      rejected = $script:State.total_rejected
      wake = $script:State.total_wake
      api_posts = $script:State.total_api_posts
      spoken = $script:State.total_spoken
    }
    recognizer_culture = $script:State.recognizer_culture
    last_text = $script:State.last_text
    last_confidence = $script:State.last_confidence
    log = $LogPath
    state = $StatePath
    events = $EventsPath
    next = "STEP 02 - Mandatory Kingsmen wake greeting only after wake proof exists."
  }
  WriteNoBom $ProofPath ($proof | ConvertTo-Json -Depth 20)

  $ledger = @(
    "",
    "## STEP 01G - Dedicated Voice Window",
    "",
    "Status: " + $script:State.status + " at " + (NowIso),
    "",
    "Purpose:",
    "- Open a visible dedicated Jarvis voice window.",
    "- Keep Windows Speech Recognition alive until the Commander closes the window.",
    "- Record speech detection, recognition, wake route, API post, and spoken reply proof.",
    "- No visual or layout files changed.",
    "",
    "Proof:",
    "- " + $LogPath,
    "- " + $StatePath,
    "- " + $EventsPath,
    "- " + $ProofPath,
    ""
  )
  Add-Content -Path $LedgerPath -Value $ledger -Encoding UTF8

  Write-Host ""
  Write-Host "STEP 01G STOPPED - proof written." -ForegroundColor Green
  Write-Host $ProofPath -ForegroundColor Yellow
}
