# KINGSMEN LOCAL MODEL WRAPPERS

## Purpose

Kingsmen uses local AI tools only through controlled wrappers.

## Working mode

Jarvis works in direct safe mode:

jarvis ask --no-stream --no-context --agent= --engine ollama --model qwen3.5:2b

## Do not use yet

Do not use:
- normal jarvis ask without safe flags
- baseline_local agent
- OpenClaw as executor
- OpenClaw WhatsApp
- browser control
- shell execution by AI

## Why wrappers exist

Direct vague prompts make the model think "Kingsmen" means the movie/franchise.
Wrappers inject the Kingsmen project boundary first.

## Current decision

Jarvis direct safe mode may be used for:
- safe summaries
- planning
- command suggestions
- proof review

It must not be used for:
- secrets
- logs
- candidate data
- payment data
- repo edits
- Oracle deployment
- Supabase service role
- PayFast actions
