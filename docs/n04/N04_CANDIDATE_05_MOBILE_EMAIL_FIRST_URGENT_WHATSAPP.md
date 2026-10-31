# N04-CANDIDATE-05 — Mobile Candidate Journey / Email and Portal Only

Builds the mobile-first candidate experience with the current approved communications boundary:
- candidate portal remains mobile-first and low-bandwidth friendly
- email is the only enabled external candidate communication channel
- secure portal inbox carries in-account messages and status history
- WhatsApp is disabled for all purposes
- SMS is disabled for all purposes
- candidate registration does not request WhatsApp or SMS consent
- high-risk and internal system alerts route to the founder/control plane, not disabled candidate channels
- provider credentials and sensitive recipient data never enter browser-visible records
- productionReady remains false until staging and release gates pass
