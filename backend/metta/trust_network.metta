; Essential Trust Network System for Climate Witness Chain
; Optimized for core functionality and performance

; Basic trust score calculation
(= (calculate-trust-score $user-id)
   (let* (($base-score (match &self (user-trust $user-id $score) $score))
          ($verification-count (match &self (user-verifications $user-id $count) $count))
          ($accuracy-rate (match &self (verification-accuracy $user-id $rate) $rate))
          ($trust-bonus (* $verification-count 2))
          ($accuracy-bonus (* $accuracy-rate 20))
          ($total-score (+ $base-score $trust-bonus $accuracy-bonus))
          ($final-score (min (max $total-score 0) 100)))
     (trust-score $user-id $final-score)))

; User verification tracking
(= (update-user-verification $user-id $event-id $result)
   (let* (($current-count (match &self (user-verifications $user-id $count) $count))
          ($new-count (+ $current-count 1))
          ($current-accuracy (match &self (verification-accuracy $user-id $rate) $rate))
          ($accuracy-update (if (eq $result verified) 
                               (+ $current-accuracy 0.1) 
                               (- $current-accuracy 0.05)))
          ($bounded-accuracy (min (max $accuracy-update 0) 1)))
     (user-verification-update $user-id $new-count $bounded-accuracy)))

; Essential trust queries for climate events
(= (get-user-trust $user-id)
   (match &self (user-trust $user-id $score) $score))

; Check if user can verify events
(= (can-verify-events $user-id)
   (let (($trust-score (get-user-trust $user-id)))
     (> $trust-score 50)))

; Get trusted verifiers for an event
(= (get-trusted-verifiers $event-id)
   (let* (($all-users (match &self (user-trust $user-id $score) $user-id))
          ($trusted-users (filter (λ ($user) (can-verify-events $user)) $all-users)))
     $trusted-users))

; Event verification consensus
(= (verify-event-consensus $event-id)
   (let* (($verifications (match &self (event-verification $event-id $user-id $result) ($user-id $result)))
          ($verified-count (length (filter (λ ($v) (eq (cadr $v) verified)) $verifications)))
          ($total-count (length $verifications))
          ($consensus-ratio (if (> $total-count 0) (/ $verified-count $total-count) 0)))
     (event-consensus $event-id $consensus-ratio $verified-count $total-count)))

; Simple trust network for essential operations
(= (trust-network-summary)
   (let* (($all-users (match &self (user-trust $user-id $score) ($user-id $score)))
          ($high-trust-users (filter (λ ($u) (> (cadr $u) 70)) $all-users))
          ($medium-trust-users (filter (λ ($u) (and (>= (cadr $u) 40) (<= (cadr $u) 70))) $all-users))
          ($low-trust-users (filter (λ ($u) (< (cadr $u) 40)) $all-users)))
     (trust-summary (length $high-trust-users) (length $medium-trust-users) (length $low-trust-users))))