# KINGSMEN JARVIS STEP 01 - VOICE INPUT CAPTURE
# This script proves the microphone hears "Jarvis".
# It does not depend on browser microphone buttons.
# It does not change the Jarvis layout.

$ErrorActionPreference = "Continue"

param(
  [string]$JarvisVoiceApi = "http://127.0.0.1:3000/api/jarvis/voice"
)

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { $Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }

$RuntimeDir = Join-Path $Repo "reports\jarvis\runtime"
$StepDir = Join-Path $Repo "reports\jarvis\steps"
$LogPath = Join-Path $RuntimeDir "STEP_01_NATIVE_VOICE_CAPTURE.log"
$EventsPath = Join-Path $RuntimeDir "STEP_01_NATIVE_VOICE_CAPTURE_EVENTS.jsonl"
$StatePath = Join-Path $RuntimeDir "STEP_01_NATIVE_VOICE_CAPTURE_STATE.json"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $StepDir | Out-Null

$ConversationUntil = (Get-Date).AddSeconds(-1)
$LastRecognized = ""
$LastRecognizedAt = Get-Date
$RecognitionStarted = $false
$TotalRecognized = 0
$TotalWake = 0
$TotalSpeechDetected = 0

function Write-StepLog {
  param([string]$Message, [string]$Color = "Cyan")
  $Line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Message
  Add-Content -Path $LogPath -Value $Line
  Write-Host $Line -ForegroundColor $Color
}

function Write-StepEvent {
  param([string]$Type, [hashtable]$Data)
  $Event = [ordered]@{
    ts = (Get-Date).ToUniversalTime().ToString("o")
    type = $Type
  }
  foreach ($Key in $Data.Keys) { $Event[$Key] = $Data[$Key] }
  Add-Content -Path $EventsPath -Value ($Event | ConvertTo-Json -Depth 12 -Compress)
}

function Save-State {
  param([string]$Status, [string]$LastText)
  $State = [ordered]@{
    step = "STEP_01_VOICE_INPUT_CAPTURE"
    status = $Status
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
    recognizer_started = $RecognitionStarted
    total_recognized = $TotalRecognized
    total_wake = $TotalWake
    total_speech_detected = $TotalSpeechDetected
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

    $Voices = $Speaker.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like "en*" }
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
    return $true
  } catch {
    return $false
  }
}

function Post-ToJarvisVoiceApi {
  param([string]$Text, [double]$Confidence)

  $Payload = @{
    text = $Text
    confidence = $Confidence
    source = "step-01-native-voice-capture"
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Depth 8

  try {
    $Response = Invoke-RestMethod -Method Post -Uri $JarvisVoiceApi -Body $Payload -ContentType "application/json" -TimeoutSec 25
    $Reply = [string]$Response.reply
    if ([string]::IsNullOrWhiteSpace($Reply)) {
      $Reply = "Voice capture confirmed, Commander. I heard you, but the Jarvis API returned no spoken reply, Sir."
    }
    Write-StepLog ("API REPLY: " + $Reply) "Green"
    Write-StepEvent "api-reply" @{ reply = $Reply; heard = $Text }
    Speak-Step $Reply
  } catch {
    $Fallback = "Voice capture confirmed, Commander. I heard " + $Text + ". The Jarvis web command API is not responding yet, Sir."
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
    Write-StepLog "Speech was heard, but waiting for wake word: Jarvis" "DarkYellow"
  }
}

function New-JarvisRecognizer {
  Add-Type -AssemblyName System.Speech

  $Cultures = @()
  try { $Cultures += [System.Globalization.CultureInfo]::CurrentCulture.Name } catch {}
  $Cultures += @("en-US", "en-GB")
  $Cultures = $Cultures | Select-Object -Unique

  foreach ($CultureName in $Cultures) {
    try {
      $Culture = [System.Globalization.CultureInfo]::GetCultureInfo($CultureName)
      $Recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($Culture)
      $Recognizer.SetInputToDefaultAudioDevice()
      Write-StepLog ("RECOGNIZER READY: " + $CultureName) "Green"
      return $Recognizer
    } catch {
      Write-StepLog ("Recognizer failed for " + $CultureName + ": " + $_.Exception.Message) "DarkYellow"
    }
  }

  $DefaultRecognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $DefaultRecognizer.SetInputToDefaultAudioDevice()
  Write-StepLog "RECOGNIZER READY: default culture" "Green"
  return $DefaultRecognizer
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01 - VOICE INPUT CAPTURE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This step proves that Windows hears your voice." -ForegroundColor White
Write-Host "Keep this window open. Say: Jarvis" -ForegroundColor Yellow
Write-Host "No browser microphone button is required." -ForegroundColor White
Write-Host ""

Write-StepLog "STEP 01 starting." "Cyan"
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

$ApiOnline = Test-JarvisApi
if ($ApiOnline) {
  Write-StepLog "Jarvis API detected on port 3000." "Green"
} else {
  Write-StepLog "Jarvis API is not online. Capture will still prove the microphone and will speak fallback replies." "DarkYellow"
}

Speak-Step "Commander, Step One voice input capture is active. Say Jarvis."

try {
  $Recognizer = New-JarvisRecognizer

  $Choices = New-Object System.Speech.Recognition.Choices
  foreach ($Phrase in @(
    "Jarvis",
    "Hey Jarvis",
    "Jarvis wake up",
    "Jarvis welcome me to Kingsmen Command",
    "Jarvis give me a command brief",
    "Jarvis what is your status",
    "Jarvis inspect Kingsmen",
    "Jarvis repair voice",
    "Jarvis are you there",
    "Jarvis respond"
  )) {
    [void]$Choices.Add($Phrase)
  }

  $GrammarBuilder = New-Object System.Speech.Recognition.GrammarBuilder
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
      Write-StepLog ("HYPOTHESIS: " + $EventArgs.Result.Text) "DarkGray"
      Write-StepEvent "hypothesis" @{ text = $EventArgs.Result.Text; confidence = $EventArgs.Result.Confidence }
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
    Write-StepLog "SPEECH REJECTED: Windows heard sound but could not recognise clear words." "DarkYellow"
    Write-StepEvent "speech-rejected" @{ reason = "unclear" }
  })

  $Recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  $RecognitionStarted = $true
  Save-State "listening" ""
  Write-StepLog "VOICE CAPTURE ACTIVE. SAY: JARVIS" "Green"

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
      if ($Key.Key -eq "S") {
        Save-State "manual-state-save" $LastRecognized
        Write-StepLog ("State saved: " + $StatePath) "Green"
      }
    }
  }

  $Recognizer.RecognizeAsyncStop()
  $Recognizer.Dispose()
  Save-State "stopped" $LastRecognized
} catch {
  Write-StepLog ("VOICE CAPTURE FATAL ERROR: " + $_.Exception.Message) "Red"
  Write-StepEvent "fatal-error" @{ error = $_.Exception.Message }
  Save-State "fatal-error" ""
  Speak-Step "Commander, Step One voice capture failed. The error has been recorded, Sir."
  Read-Host "Press Enter to close"
  exit 1
}
