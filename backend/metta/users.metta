; News Integrity - User Knowledge Base
; Matches our actual User model structure


; User roles (from backend models)
(role user)
(role researcher)

     ; Role permissions
(can-report user climate-events)
(can-report researcher climate-events)
(can-validate researcher events)


     ; Check if user can perform action based on trust and role
(= (can-perform-action $user-id $action)
(let* (($trust-score (match &self (trust-score $user-id $score) $score))
($user-role (match &self (user-role $user-id $role) $role))
($min-trust (match &self (trust-threshold $action $threshold) $threshold)))
(and (>= $trust-score $min-trust)
(match &self (can-report $user-role $action) true))))

     ; Update trust score based on verification accuracy
(= (update-trust-score $user-id $accuracy)
(let* (($current-trust (match &self (trust-score $user-id $score) $score))
($delta (if (> $accuracy 0.8) 5
(if (> $accuracy 0.6) 2
(if (> $accuracy 0.4) 0 -3))))
($new-trust (max 0 (min 100 (+ $current-trust $delta)))))
(trust-score $user-id $new-trust)))