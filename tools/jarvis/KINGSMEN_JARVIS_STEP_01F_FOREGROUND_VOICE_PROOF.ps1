# KINGSMEN JARVIS STEP 01F - FOREGROUND VOICE PROOF
# Runtime-only step. No visual files are changed.
# Purpose:
# - Fix the Step 01 problem where the script prints "VOICE CAPTURE ACTIVE" then returns to the PowerShell prompt.
# - Keep the recognizer alive in the foreground.
# - Record SPEECH DETECTED, RECOGNIZED, WAKE ROUTE ACTIVE, API POST, and spoken reply proof.
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

function AppendNoBom($Path, $Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  $existing = ""
  if (Test-Path $Path) { $existing = [System.IO.File]::ReadAllText($Path) }
  [System.IO.File]::WriteAllText($Path, ($existing + $Text), $utf8NoBom)
}

function Sha256Path($Path) {
  if (!(Test-Path $Path)) { return $null }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
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

$LogPath = Join-Path $RuntimeDir "STEP_01F_FOREGROUND_VOICE_PROOF.log"
$StatePath = Join-Path $RuntimeDir "STEP_01F_FOREGROUND_VOICE_PROOF_STATE.json"
$EventsPath = Join-Path $RuntimeDir "STEP_01F_FOREGROUND_VOICE_PROOF_EVENTS.jsonl"
$ProofPath = Join-Path $StepsDir "STEP_01F_FOREGROUND_VOICE_PROOF_PROOF.json"
$LedgerPath = Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md"
$ApiUrl = "http://127.0.0.1:3000/api/jarvis/voice"
$StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
$WakeGreeting = "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine."

$script:State = [ordered]@{
  step = "STEP_01F_FOREGROUND_VOICE_PROOF"
  status = "starting"
  updated_at = (Get-Date).ToUniversalTime().ToString("o")
  recognizer_started = $false
  recognizer_culture = ""
  total_speech_detected = 0
  total_hypothesized = 0
  total_recognized = 0
  total_rejected = 0
  total_wake = 0
  total_api_posts = 0
  last_text = ""
  last_confidence = $null
  last_event = ""
  api = $ApiUrl
  log = $LogPath
  events = $EventsPath
  foreground_loop_alive = $false
  layout_files_changed = $false
}

function SaveState() {
  $script:State.updated_at = (Get-Date).ToUniversalTime().ToString("o")
  WriteNoBom $StatePath ($script:State | ConvertTo-Json -Depth 10)
}

function WriteLog($Message) {
  $line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Message
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $line
  $script:State.last_event = $Message
  SaveState
}

function WriteEvent($Type, $Text, $Extra) {
  $obj = [ordered]@{
    ts = (Get-Date).ToUniversalTime().ToString("o")
    type = $Type
    text = $Text
    extra = $Extra
  }
  Add-Content -Path $EventsPath -Value ($obj | ConvertTo-Json -Compress -Depth 10) -Encoding UTF8
}

function Speak($Text) {
  try {
    $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $speaker.Rate = -1
    $speaker.Volume = 100
    $speaker.Speak($Text)
    $speaker.Dispose()
    WriteEvent "spoken" $Text @{}
    WriteLog ("SPOKEN: " + $Text)
  } catch {
    WriteLog ("SPEAK FAILED: " + $_.Exception.Message)
    WriteEvent "speak-error" $_.Exception.Message @{}
  }
}

function IsWake($Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return $false }
  $clean = $Text.ToLowerInvariant()
  if ($clean.Contains("jarvis")) { return $true }
  if ($clean.Contains("javis")) { return $true }
  if ($clean.Contains("jervis")) { return $true }
  if ($clean.Contains("service") -and $clean.Contains("king")) { return $true }
  return $false
}

function PostToApi($Text) {
  try {
    $body = @{
      text = $Text
      command = $Text
      source = "step-01f-foreground-native-voice"
      step = "STEP_01F_FOREGROUND_VOICE_PROOF"
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

    WriteEvent "api-post-ok" $Text @{ reply = $reply }
    WriteLog "API POST OK"
    Speak $reply
  } catch {
    WriteEvent "api-post-failed" $Text @{ error = $_.Exception.Message }
    WriteLog ("API POST FAILED: " + $_.Exception.Message)
    Speak $WakeGreeting
  }
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01F - FOREGROUND VOICE PROOF" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This keeps the Windows recognizer alive. No visual/layout files are changed." -ForegroundColor Yellow
Write-Host "Keep this window open. Say: Jarvis" -ForegroundColor Yellow
Write-Host "Press Q to stop after proof is captured." -ForegroundColor Yellow
Write-Host ""

# Reset runtime proof files for this foreground test.
WriteNoBom $LogPath ""
WriteNoBom $EventsPath ""
SaveState

# Install a stable repo copy and launcher without nested script generation.
try {
  if ($PSCommandPath) {
    $RepoTool = Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01F_FOREGROUND_VOICE_PROOF.ps1"
    Copy-Item $PSCommandPath $RepoTool -Force
    Write-Host ("WROTE: tools\jarvis\KINGSMEN_JARVIS_STEP_01F_FOREGROUND_VOICE_PROOF.ps1") -ForegroundColor Green

    $CmdPath = "C:\Kingsmen\JARVIS_STEP_01F_FOREGROUND_VOICE_PROOF.cmd"
    $CmdLines = @(
      "@echo off",
      "title KINGSMEN JARVIS STEP 01F FOREGROUND VOICE PROOF",
      "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01F_FOREGROUND_VOICE_PROOF.ps1"""
    )
    [System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)
    Write-Host ("WROTE: " + $CmdPath) -ForegroundColor Green
  }
} catch {
  Write-Host ("Launcher write warning: " + $_.Exception.Message) -ForegroundColor Yellow
}

WriteLog "STEP 01F starting."
WriteEvent "step-start" "STEP 01F starting" @{}

try {
  Add-Type -AssemblyName System.Speech
  WriteLog "System.Speech loaded."
} catch {
  WriteLog ("System.Speech load failed: " + $_.Exception.Message)
  throw
}

try {
  $apiStatus = Invoke-RestMethod -Uri $StatusUrl -Method Get -TimeoutSec 4
  WriteLog "Jarvis API detected on port 3000."
  WriteEvent "api-status-ok" "Jarvis API detected" @{}
} catch {
  WriteLog ("Jarvis API not detected. Voice proof will still capture microphone. " + $_.Exception.Message)
  WriteEvent "api-status-failed" "Jarvis API not detected" @{ error = $_.Exception.Message }
}

$engine = $null
$recognizerInfo = $null

try {
  $installed = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()
  foreach ($cultureName in @("en-ZA", "en-US", "en-GB")) {
    foreach ($info in $installed) {
      if ($info.Culture.Name -eq $cultureName) {
        $recognizerInfo = $info
        break
      }
    }
    if ($recognizerInfo) { break }
  }

  if ($recognizerInfo) {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine($recognizerInfo)
  } else {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $recognizerInfo = $engine.RecognizerInfo
  }

  $script:State.recognizer_culture = $engine.RecognizerInfo.Culture.Name
  WriteLog ("RECOGNIZER READY: " + $engine.RecognizerInfo.Culture.Name)

  $choices = New-Object System.Speech.Recognition.Choices
  [void]$choices.Add("Jarvis")
  [void]$choices.Add("Hey Jarvis")
  [void]$choices.Add("Good morning Jarvis")
  [void]$choices.Add("Good evening Jarvis")
  [void]$choices.Add("Jarvis give me a command brief")
  [void]$choices.Add("Jarvis inspect Kingsmen")
  [void]$choices.Add("Jarvis what is your status")
  [void]$choices.Add("Jarvis welcome me to Kingsmen Command")

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
    param($sender, $eventArgs)
    $script:State.total_speech_detected = [int]$script:State.total_speech_detected + 1
    $script:State.status = "speech_detected"
    SaveState
    WriteEvent "speech-detected" "Speech detected by Windows audio input." @{}
    WriteLog "SPEECH DETECTED"
  })

  $engine.add_SpeechHypothesized({
    param($sender, $eventArgs)
    $script:State.total_hypothesized = [int]$script:State.total_hypothesized + 1
    $script:State.last_text = [string]$eventArgs.Result.Text
    $script:State.status = "hypothesized"
    SaveState
    WriteEvent "speech-hypothesized" ([string]$eventArgs.Result.Text) @{ confidence = $eventArgs.Result.Confidence }
    WriteLog ("HYPOTHESIZED: " + [string]$eventArgs.Result.Text)
  })

  $engine.add_SpeechRecognitionRejected({
    param($sender, $eventArgs)
    $script:State.total_rejected = [int]$script:State.total_rejected + 1
    $script:State.status = "rejected"
    SaveState
    WriteEvent "recognition-rejected" "Speech heard but not recognized with enough confidence." @{}
    WriteLog "RECOGNITION REJECTED"
  })

  $engine.add_SpeechRecognized({
    param($sender, $eventArgs)

    $text = [string]$eventArgs.Result.Text
    $confidence = [double]$eventArgs.Result.Confidence

    $script:State.total_recognized = [int]$script:State.total_recognized + 1
    $script:State.last_text = $text
    $script:State.last_confidence = $confidence
    $script:State.status = "recognized"
    SaveState

    WriteEvent "recognized" $text @{ confidence = $confidence }
    WriteLog ("RECOGNIZED: " + $text + " | confidence=" + $confidence)

    if (IsWake $text) {
      $script:State.total_wake = [int]$script:State.total_wake + 1
      $script:State.status = "wake_route_active"
      SaveState

      WriteEvent "wake-route-active" $text @{ confidence = $confidence }
      WriteLog "WAKE ROUTE ACTIVE"
      PostToApi $text
    } else {
      WriteLog "RECOGNIZED NON-WAKE SPEECH"
    }
  })

  $engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  $script:State.recognizer_started = $true
  $script:State.status = "listening"
  $script:State.foreground_loop_alive = $true
  SaveState
  WriteEvent "listening" "Foreground recognition loop alive. Say Jarvis." @{}
  WriteLog "FOREGROUND VOICE CAPTURE ACTIVE. SAY: JARVIS"
  WriteLog "This window must NOT return to a PowerShell prompt while listening."

  $lastHeartbeat = Get-Date
  while ($true) {
    Start-Sleep -Milliseconds 250

    $now = Get-Date
    if (($now - $lastHeartbeat).TotalSeconds -ge 15) {
      $lastHeartbeat = $now
      WriteEvent "foreground-heartbeat" "Still listening." @{}
      WriteLog "STILL LISTENING - say Jarvis, or press Q to stop."
    }

    try {
      if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq "Q") {
          WriteLog "STOP REQUESTED BY COMMANDER."
          break
        }
      }
    } catch {
      # Non-interactive console fallback: keep listening.
    }
  }
}
finally {
  if ($engine -ne $null) {
    try { $engine.RecognizeAsyncCancel() } catch {}
    try { $engine.RecognizeAsyncStop() } catch {}
    try { $engine.Dispose() } catch {}
  }

  $script:State.foreground_loop_alive = $false
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

  $Proof = [ordered]@{
    step = "STEP_01F_FOREGROUND_VOICE_PROOF"
    status = $script:State.status
    created_at = (Get-Date).ToUniversalTime().ToString("o")
    repo = $Repo
    no_visual_files_changed = $true
    purpose = "Keep recognizer alive in foreground and prove Windows voice detection, recognition, wake route, API post, and spoken reply."
    totals = [ordered]@{
      speech_detected = $script:State.total_speech_detected
      hypothesized = $script:State.total_hypothesized
      recognized = $script:State.total_recognized
      rejected = $script:State.total_rejected
      wake = $script:State.total_wake
      api_posts = $script:State.total_api_posts
    }
    recognizer_culture = $script:State.recognizer_culture
    last_text = $script:State.last_text
    last_confidence = $script:State.last_confidence
    log = $LogPath
    state = $StatePath
    events = $EventsPath
    layout_lock = (Join-Path $Repo "manifests\jarvis\jarvis-layout-lock.json")
    layout_lock_sha256 = (Sha256Path (Join-Path $Repo "manifests\jarvis\jarvis-layout-lock.json"))
    next = "STEP 02 - Mandatory Kingsmen wake greeting only after wake proof exists."
  }
  WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 20)

  $LedgerLines = @(
    "",
    "## STEP 01F - Foreground Voice Proof",
    "",
    "Status: " + $script:State.status + " at " + (Get-Date).ToUniversalTime().ToString("o"),
    "",
    "Purpose:",
    "- Keep the Windows recognizer alive in the foreground.",
    "- Prove speech detection, recognition, wake route, API post, and spoken reply.",
    "- No visual or layout files changed.",
    "",
    "Runtime proof:",
    "- " + $LogPath,
    "- " + $StatePath,
    "- " + $EventsPath,
    "- " + $ProofPath,
    ""
  )
  Add-Content -Path $LedgerPath -Value $LedgerLines -Encoding UTF8

  Write-Host ""
  Write-Host "STEP 01F STOPPED - proof written." -ForegroundColor Green
  Write-Host $ProofPath -ForegroundColor Yellow
}
