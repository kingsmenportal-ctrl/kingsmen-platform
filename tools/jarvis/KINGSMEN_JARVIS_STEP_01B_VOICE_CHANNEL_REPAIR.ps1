# KINGSMEN JARVIS STEP 01B - VOICE CHANNEL REPAIR
# Repairs Step 01 voice capture without changing the Jarvis layout.
# Adds clearer diagnostics:
# 1. Is the Jarvis API online?
# 2. Is Windows speech recognition installed?
# 3. Is a microphone device visible?
# 4. Is any speech detected?
# 5. Is the word Jarvis recognized?

$ErrorActionPreference = "Continue"

param(
  [string]$JarvisVoiceApi = "http://127.0.0.1:3000/api/jarvis/voice"
)

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { $Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }

$RuntimeDir = Join-Path $Repo "reports\jarvis\runtime"
$StepDir = Join-Path $Repo "reports\jarvis\steps"
$LogPath = Join-Path $RuntimeDir "STEP_01B_VOICE_CHANNEL_REPAIR.log"
$EventsPath = Join-Path $RuntimeDir "STEP_01B_VOICE_CHANNEL_REPAIR_EVENTS.jsonl"
$StatePath = Join-Path $RuntimeDir "STEP_01B_VOICE_CHANNEL_REPAIR_STATE.json"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $StepDir | Out-Null

$Script:ConversationUntil = (Get-Date).AddSeconds(-1)
$Script:LastRecognized = ""
$Script:LastRecognizedAt = Get-Date
$Script:RecognitionStarted = $false
$Script:TotalRecognized = 0
$Script:TotalWake = 0
$Script:TotalSpeechDetected = 0
$Script:TotalHypothesis = 0
$Script:ApiOnline = $false

function Write-StepLog {
  param([string]$Message, [string]$Color = "Cyan")
  $Line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Message
  Add-Content -Path $LogPath -Value $Line -Encoding UTF8
  Write-Host $Line -ForegroundColor $Color
}

function Write-StepEvent {
  param([string]$Type, [hashtable]$Data)
  $Event = [ordered]@{
    ts = (Get-Date).ToUniversalTime().ToString("o")
    type = $Type
  }
  foreach ($Key in $Data.Keys) { $Event[$Key] = $Data[$Key] }
  Add-Content -Path $EventsPath -Value ($Event | ConvertTo-Json -Depth 12 -Compress) -Encoding UTF8
}

function Save-State {
  param([string]$Status, [string]$LastText)
  $State = [ordered]@{
    step = "STEP_01B_VOICE_CHANNEL_REPAIR"
    status = $Status
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
    recognizer_started = $Script:RecognitionStarted
    api_online = $Script:ApiOnline
    total_speech_detected = $Script:TotalSpeechDetected
    total_hypothesis = $Script:TotalHypothesis
    total_recognized = $Script:TotalRecognized
    total_wake = $Script:TotalWake
    last_text = $LastText
    api = $JarvisVoiceApi
    log = $LogPath
    events = $EventsPath
  }
  $State | ConvertTo-Json -Depth 10 | Set-Content -Path $StatePath -Encoding UTF8
}

function Speak-Step {
  param([string]$Text)
  try {
    Add-Type -AssemblyName System.Speech -ErrorAction SilentlyContinue
    $Speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $Speaker.Volume = 100
    $Speaker.Rate = -2
    $Voices = @($Speaker.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like "en*" })
    if ($Voices.Count -gt 0) {
      $Preferred = $Voices | Where-Object { $_.VoiceInfo.Name -match "David|Mark|George|Ryan|James|Daniel" } | Select-Object -First 1
      if ($Preferred) { $Speaker.SelectVoice($Preferred.VoiceInfo.Name) }
      else { $Speaker.SelectVoice($Voices[0].VoiceInfo.Name) }
    }
    [void]$Speaker.Speak($Text)
    $Speaker.Dispose()
  } catch {
    Write-StepLog ("TTS ERROR: " + $_.Exception.Message) "Red"
  }
}

function Test-JarvisApi {
  try {
    $StatusUrl = "http://127.0.0.1:3000/api/jarvis/status"
    $null = Invoke-RestMethod -Method Get -Uri $StatusUrl -TimeoutSec 4
    $Script:ApiOnline = $true
    return $true
  } catch {
    $Script:ApiOnline = $false
    return $false
  }
}

function List-MicrophoneDevices {
  Write-StepLog "Checking Windows microphone/audio capture devices..." "Cyan"
  try {
    $Devices = @(Get-CimInstance Win32_PnPEntity | Where-Object {
      ($_.Name -match "Microphone|Mic|Audio|Input|Realtek|Headset|Webcam") -and ($_.Status -ne $null)
    } | Select-Object -First 30 Name,Status,PNPClass)

    if ($Devices.Count -eq 0) {
      Write-StepLog "NO MICROPHONE-LIKE DEVICE FOUND by Windows device scan." "Red"
      Write-StepEvent "microphone-scan" @{ found = $false }
    } else {
      foreach ($D in $Devices) {
        Write-StepLog ("DEVICE: " + $D.Name + " | Status: " + $D.Status + " | Class: " + $D.PNPClass) "DarkCyan"
      }
      Write-StepEvent "microphone-scan" @{ found = $true; count = $Devices.Count }
    }
  } catch {
    Write-StepLog ("MIC DEVICE SCAN ERROR: " + $_.Exception.Message) "DarkYellow"
    Write-StepEvent "microphone-scan-error" @{ error = $_.Exception.Message }
  }
}

function List-SpeechRecognizers {
  try {
    Add-Type -AssemblyName System.Speech
    $Installed = @([System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers())
    if ($Installed.Count -eq 0) {
      Write-StepLog "NO INSTALLED WINDOWS SPEECH RECOGNIZERS FOUND." "Red"
      Write-StepEvent "speech-recognizers" @{ count = 0 }
      return
    }
    foreach ($Info in $Installed) {
      Write-StepLog ("SPEECH RECOGNIZER: " + $Info.Culture.Name + " | " + $Info.Description) "DarkCyan"
    }
    Write-StepEvent "speech-recognizers" @{ count = $Installed.Count }
  } catch {
    Write-StepLog ("SPEECH RECOGNIZER LIST ERROR: " + $_.Exception.Message) "DarkYellow"
  }
}

function Post-ToJarvisVoiceApi {
  param([string]$Text, [double]$Confidence)

  $Payload = @{
    text = $Text
    confidence = $Confidence
    source = "step-01b-voice-channel-repair"
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Depth 8

  try {
    $Response = Invoke-RestMethod -Method Post -Uri $JarvisVoiceApi -Body $Payload -ContentType "application/json" -TimeoutSec 25
    $Reply = [string]$Response.reply
    if ([string]::IsNullOrWhiteSpace($Reply)) {
      $Reply = "Voice route confirmed, Commander. I heard you, but the Jarvis API returned no spoken reply, Sir."
    }
    Write-StepLog ("API REPLY: " + $Reply) "Green"
    Write-StepEvent "api-reply" @{ reply = $Reply; heard = $Text }
    Speak-Step $Reply
  } catch {
    $Fallback = "Voice capture confirmed, Commander. I heard " + $Text + ". The Jarvis web API is still offline, Sir."
    Write-StepLog ("API ERROR: " + $_.Exception.Message) "Red"
    Write-StepEvent "api-error" @{ heard = $Text; error = $_.Exception.Message }
    Speak-Step $Fallback
  }
}

function Process-RecognizedSpeech {
  param([string]$Text, [double]$Confidence)

  if ([string]::IsNullOrWhiteSpace($Text)) { return }

  $Now = Get-Date
  if (($Text -eq $Script:LastRecognized) -and (($Now - $Script:LastRecognizedAt).TotalMilliseconds -lt 900)) {
    Write-StepLog ("DUPLICATE IGNORED: " + $Text) "DarkGray"
    return
  }

  $Script:LastRecognized = $Text
  $Script:LastRecognizedAt = $Now
  $Script:TotalRecognized += 1

  $HasWake = $Text -match "(?i)\b(hey\s+)?jarvis\b"
  $InConversation = $Now -lt $Script:ConversationUntil

  Write-StepLog ("RECOGNIZED [" + [math]::Round($Confidence, 3) + "]: " + $Text) "Yellow"
  Write-StepEvent "recognized" @{ text = $Text; confidence = $Confidence; has_wake = $HasWake; in_conversation = $InConversation }
  Save-State "recognized" $Text

  if ($HasWake -or $InConversation) {
    $Script:ConversationUntil = $Now.AddSeconds(90)
    if ($HasWake) { $Script:TotalWake += 1 }

    Write-StepLog "WAKE ROUTE ACTIVE. Posting speech to Jarvis voice API." "Green"
    Write-StepEvent "wake-route" @{ text = $Text; confidence = $Confidence }
    Post-ToJarvisVoiceApi -Text $Text -Confidence $Confidence
    Save-State "wake-captured" $Text
  } else {
    Write-StepLog "Speech was heard, but wake word was not found. Say: Jarvis" "DarkYellow"
  }
}

function New-JarvisRecognizer {
  Add-Type -AssemblyName System.Speech

  $Installed = @([System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers())
  $CandidateInfos = @()

  foreach ($Preferred in @("en-ZA", "en-US", "en-GB")) {
    $Match = $Installed | Where-Object { $_.Culture.Name -eq $Preferred } | Select-Object -First 1
    if ($Match) { $CandidateInfos += $Match }
  }

  foreach ($Info in $Installed) {
    if ($Info.Culture.Name -like "en*" -and ($CandidateInfos.Culture.Name -notcontains $Info.Culture.Name)) {
      $CandidateInfos += $Info
    }
  }

  if ($CandidateInfos.Count -eq 0) {
    Write-StepLog "No English recognizer found. Trying default recognizer." "DarkYellow"
    $Recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $Recognizer.SetInputToDefaultAudioDevice()
    return $Recognizer
  }

  foreach ($Info in $CandidateInfos) {
    try {
      $Recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($Info)
      $Recognizer.SetInputToDefaultAudioDevice()
      Write-StepLog ("RECOGNIZER READY: " + $Info.Culture.Name + " | " + $Info.Description) "Green"
      return $Recognizer
    } catch {
      Write-StepLog ("Recognizer failed for " + $Info.Culture.Name + ": " + $_.Exception.Message) "DarkYellow"
    }
  }

  throw "No recognizer could attach to the default audio input device."
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01B - VOICE CHANNEL REPAIR" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Keep this window open." -ForegroundColor White
Write-Host "Say clearly: Jarvis" -ForegroundColor Yellow
Write-Host "This window must show SPEECH DETECTED before we move on." -ForegroundColor White
Write-Host ""

Write-StepLog "STEP 01B starting." "Cyan"
Save-State "starting" ""

try {
  Add-Type -AssemblyName System.Speech
  Write-StepLog "System.Speech loaded." "Green"
} catch {
  Write-StepLog ("System.Speech failed: " + $_.Exception.Message) "Red"
  Speak-Step "Commander, Windows speech recognition is not available on this machine, Sir."
  Save-State "system-speech-failed" ""
  Read-Host "Press Enter to close"
  exit 1
}

List-SpeechRecognizers
List-MicrophoneDevices

$ApiOnline = Test-JarvisApi
if ($ApiOnline) {
  Write-StepLog "Jarvis API detected on port 3000." "Green"
} else {
  Write-StepLog "Jarvis API is not online on port 3000. Voice capture will still test the microphone." "DarkYellow"
}

Speak-Step "Commander, Step One B voice channel repair is active. Say Jarvis."

try {
  $Recognizer = New-JarvisRecognizer

  $Choices = New-Object System.Speech.Recognition.Choices
  foreach ($Phrase in @(
    "Jarvis",
    "Hey Jarvis",
    "Jarvis wake up",
    "Jarvis respond",
    "Jarvis are you there",
    "Jarvis welcome me to Kingsmen Command",
    "Jarvis give me a command brief",
    "Jarvis what is your status",
    "Jarvis inspect Kingsmen",
    "Jarvis repair voice"
  )) {
    [void]$Choices.Add($Phrase)
  }

  $GrammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
  $GrammarBuilder.Culture = $Recognizer.RecognizerInfo.Culture
  $GrammarBuilder.Append($Choices)
  $WakeGrammar = New-Object System.Speech.Recognition.Grammar($GrammarBuilder)
  $WakeGrammar.Name = "Kingsmen Jarvis Wake Grammar"

  $Dictation = New-Object System.Speech.Recognition.DictationGrammar
  $Dictation.Name = "Dictation"

  $Recognizer.LoadGrammar($WakeGrammar)
  $Recognizer.LoadGrammar($Dictation)

  $Recognizer.add_AudioStateChanged({
    param($Sender, $EventArgs)
    Write-StepLog ("MIC AUDIO STATE: " + $EventArgs.AudioState) "DarkCyan"
    Write-StepEvent "audio-state" @{ state = [string]$EventArgs.AudioState }
  })

  $Recognizer.add_SpeechDetected({
    param($Sender, $EventArgs)
    $Script:TotalSpeechDetected += 1
    Write-StepLog "SPEECH DETECTED by microphone." "Magenta"
    Write-StepEvent "speech-detected" @{ audio_position = [string]$EventArgs.AudioPosition }
    Save-State "speech-detected" ""
  })

  $Recognizer.add_SpeechHypothesized({
    param($Sender, $EventArgs)
    if ($EventArgs.Result -and $EventArgs.Result.Text) {
      $Script:TotalHypothesis += 1
      Write-StepLog ("HYPOTHESIS: " + $EventArgs.Result.Text) "DarkGray"
      Write-StepEvent "hypothesis" @{ text = $EventArgs.Result.Text; confidence = $EventArgs.Result.Confidence }
      Save-State "hypothesis" $EventArgs.Result.Text
    }
  })

  $Recognizer.add_SpeechRecognized({
    param($Sender, $EventArgs)
    try {
      if ($EventArgs.Result) {
        Process-RecognizedSpeech -Text $EventArgs.Result.Text -Confidence $EventArgs.Result.Confidence
      }
    } catch {
      Write-StepLog ("RECOGNITION HANDLER ERROR: " + $_.Exception.Message) "Red"
      Write-StepEvent "handler-error" @{ error = $_.Exception.Message }
    }
  })

  $Recognizer.add_SpeechRecognitionRejected({
    param($Sender, $EventArgs)
    Write-StepLog "SPEECH REJECTED: sound was heard but words were unclear." "DarkYellow"
    Write-StepEvent "speech-rejected" @{ reason = "unclear" }
    Save-State "speech-rejected" ""
  })

  $Recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  $Script:RecognitionStarted = $true
  Save-State "listening" ""
  Write-StepLog "VOICE CAPTURE ACTIVE. SAY: JARVIS" "Green"
  Write-StepLog "Keys: T = test API, D = device scan, S = save state, Q = quit" "Cyan"

  while ($true) {
    Start-Sleep -Milliseconds 300

    if ([Console]::KeyAvailable) {
      $Key = [Console]::ReadKey($true)
      if ($Key.Key -eq "Q") {
        Write-StepLog "Quit requested." "Yellow"
        break
      }
      if ($Key.Key -eq "T") {
        Write-StepLog "Manual API test requested." "Yellow"
        Post-ToJarvisVoiceApi -Text "Jarvis" -Confidence 1.0
      }
      if ($Key.Key -eq "D") {
        List-MicrophoneDevices
      }
      if ($Key.Key -eq "S") {
        Save-State "manual-state-save" $Script:LastRecognized
        Write-StepLog ("State saved: " + $StatePath) "Green"
      }
    }
  }

  $Recognizer.RecognizeAsyncStop()
  $Recognizer.Dispose()
  Save-State "stopped" $Script:LastRecognized
} catch {
  Write-StepLog ("VOICE CAPTURE FATAL ERROR: " + $_.Exception.Message) "Red"
  Write-StepEvent "fatal-error" @{ error = $_.Exception.Message }
  Save-State "fatal-error" ""
  Speak-Step "Commander, Step One B voice capture failed. The error has been recorded, Sir."
  Read-Host "Press Enter to close"
  exit 1
}
