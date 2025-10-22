; Simple Economic Impact Analysis - Essential Functions Only
; Focuses on event-economic correlation and smart contract triggers

; Correlate climate events with economic impact (used by economic_impact_service.py)
(= (correlate-event-economic-impact $event-id)
   (let* (($event (match &self (climate-event $event-id $type $location $severity $impact) 
                     ($type $location $severity $impact)))
          ($event-type (car-atom $event))
          ($location (car-atom (cdr-atom $event)))
          ($severity (car-atom (cdr-atom (cdr-atom $event))))
          ($base-impact (get-base-economic-impact $event-type)) ;; this is based on the money used
          ($location-multiplier (get-location-economic-multiplier $location)) ;; this is based on the location
          ($total-impact (* $base-impact (* $severity $location-multiplier))))
     (economic-correlation $event-id $event-type $total-impact $severity)))

; Get base economic impact by event type
(= (get-base-economic-impact $event-type)
   (case $event-type
     (drought 1000)
     (flood 1500)
     (locust 800)
     (extreme_heat 600)
     (default 500)))



; Trigger micro-insurance smart contract (used by insurance_service.py)
(= (trigger-micro-insurance $event-id $location $severity)
   (let* (($affected-users (match &self (user-location $user-id $user-loc) ;; gets nearby users
                              (if (< (distance $location $user-loc) 25) $user-id (empty))))
          ($total-payout (foldl-atom $affected-users 0 $acc $user-id
                           (let (($coverage (match &self (insurance-policy $user-id $coverage-amount) $coverage-amount)))
                             (+ $acc (* $coverage (* $severity 0.8))))))
          ($contract-call (smart-contract-call micro-insurance-payout $event-id $total-payout)))
     (micro-insurance-triggered $event-id $total-payout $contract-call)))

; Trigger DAO relief fund (used by dao_governance_service.py)
(= (trigger-dao-relief $event-id $location $severity)
   (let* (($base-relief 1000)
          ($severity-multiplier (* $severity 5))
          ($location-factor (get-location-vulnerability $location))
          ($relief-amount (* $base-relief $severity-multiplier $location-factor))
          ($auto-execute (> $severity 0.8))
          ($contract-call (smart-contract-call dao-relief-fund $event-id $relief-amount $auto-execute)))
     (dao-relief-triggered $event-id $relief-amount $auto-execute $contract-call)))

; Helper functions
(= (distance $loc1 $loc2)
   (let* (($lat1 (car-atom $loc1))
          ($lng1 (car-atom (cdr-atom $loc1)))
          ($lat2 (car-atom $loc2))
          ($lng2 (car-atom (cdr-atom $loc2)))
          ($dlat (- $lat2 $lat1))
          ($dlng (- $lng2 $lng1)))
     (sqrt (+ (* $dlat $dlat) (* $dlng $dlng)))))

(= (get-location-vulnerability $location)
   (let (($vulnerability (match &self (location-vulnerability $location $value) $value)))
     (if $vulnerability $vulnerability 1.0))) 

(= (smart-contract-call $contract-type $param1 $param2)
   (contract-execution $contract-type $param1 $param2 (current-timestamp)))

(= (current-timestamp)
   1704067200)