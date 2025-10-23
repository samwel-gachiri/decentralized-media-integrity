; Decentralized News Integrity - Helper Functions
; This file contains utility functions and mathematical operations for news verification


(= (distance $lat1 $lng1 $lat2 $lng2)
(let* (($dlat (- $lat2 $lat1))
($dlng (- $lng2 $lng1)))
((py-atom math.sqrt) (+ (* $dlat $dlat) (* $dlng $dlng)))))


; Time difference calculation (in hours) for news timeliness
(= (time-diff $time1 $time2)
(and (parse-time $time1 $t1)
(parse-time $time2 $t2)
(- $t2 $t1 $diff)
(abs $diff $abs-diff)
(/ $abs-diff 3600 $hours))  ; Convert seconds to hours
$hours)

; Check if news reports are within specified hours of each other (for cross-verification)
(= (within-hours $news1 $news2 $max-hours)
(and (timestamp $news1 $time1)
(timestamp $news2 $time2)
(time-diff $time1 $time2 $diff)
(<= $diff $max-hours))
True)

; Check if two news reports are of the same type/category
(= (same-news-category $news1 $news2)
(and (news-category $news1 $category)
(news-category $news2 $category))
True)

; Check if two news reports are at the same location (within 10km for news relevance)
(= (same-location $news1 $news2)
(and (gps-coords $news1 ($lat1 $lng1))
(gps-coords $news2 ($lat2 $lng2))
(distance $lat1 $lng1 $lat2 $lng2 $dist)
(<= $dist 10))  ; 10km radius for news relevance
True)

; Check if coordinates are within a region (simplified bounding box for news regions)
(= (in-region $lat $lng $region)
(and (region-bounds $region $min-lat $max-lat $min-lng $max-lng)
(>= $lat $min-lat)
(<= $lat $max-lat)
(>= $lng $min-lng)
(<= $lng $max-lng))
True)

; Region bounding boxes (approximate for major news regions)
(region-bounds "North America" 25 -60 -125 -65)
(region-bounds "Europe" 35 70 -10 40)
(region-bounds "Asia" -10 80 25 180)
(region-bounds "Africa" -35 35 -20 55)
(region-bounds "South America" -55 15 -85 -35)
(region-bounds "Australia" -45 -10 110 155)

; Check if media metadata is consistent (timestamp matches news timestamp)
(= (metadata-consistent $media-link $news-time $coords)
(and (extract-media-time $media-link $media-time)
(time-diff $news-time $media-time $diff)
(<= $diff 2))  ; Within 2 hours for news timeliness
True)

; Trust score validation (0-100 scale)
(= (valid-trust-score $score)
(and (>= $score 0)
(<= $score 100))
True)

; Calculate trust score change based on verification accuracy
(= (trust-delta $accuracy)
(cond ((<= $accuracy 0.5) -10)     ; Poor accuracy: -10 points
((<= $accuracy 0.7) -2)      ; Average accuracy: -2 points
((<= $accuracy 0.9) 5)       ; Good accuracy: +5 points
(True 10))                   ; Excellent accuracy: +10 points
$delta)

; News credibility calculation based on multiple factors
(= (calculate-credibility $source-credibility $cross-references $timeliness)
(cond ((and (> $source-credibility 0.8) (>= $cross-references 3) (<= $timeliness 24)) 0.95)
((and (> $source-credibility 0.6) (>= $cross-references 2) (<= $timeliness 48)) 0.8)
((and (> $source-credibility 0.4) (>= $cross-references 1) (<= $timeliness 72)) 0.6)
(True 0.3))
$credibility)

; Reward calculation with adjustments based on news integrity
(= (adjusted-reward $base-amount $trust-score $integrity-level $source-credibility)
(and (trust-multiplier $trust-score $trust-mult)
(integrity-multiplier $integrity-level $integrity-mult)
(credibility-multiplier $source-credibility $credibility-mult)
(* $base-amount $trust-mult $temp1)
(* $temp1 $integrity-mult $temp2)
(* $temp2 $credibility-mult $final-amount))
$final-amount)

; Multiplier functions for rewards
(= (trust-multiplier $score)
(cond ((>= $score 90) 1.5)   ; 50% bonus for very high trust
((>= $score 80) 1.2)   ; 20% bonus for high trust
((>= $score 60) 1.0)   ; No adjustment for adequate trust
(True 0.7))             ; 30% reduction for low trust
$multiplier)

(= (integrity-multiplier $integrity-level)
(cond ((= $integrity-level verified) 2.0)
((= $integrity-level high) 1.5)
((= $integrity-level medium) 1.0)
((= $integrity-level low) 0.5))
$multiplier)

(= (credibility-multiplier $credibility)
(cond ((>= $credibility 0.9) 1.3)    ; 30% bonus for highly credible sources
((>= $credibility 0.7) 1.1)    ; 10% bonus for credible sources
((>= $credibility 0.5) 1.0)    ; No adjustment for moderate sources
(True 0.8))                    ; 20% reduction for low credibility
$multiplier)

; News timeliness validation (news should be recent for integrity)
(= (timely-news $news)
(and (timestamp $news $time)
(current-time $now)
(time-diff $time $now $age-hours)
(<= $age-hours 168))  ; Within 1 week for news relevance
True)

; Check if user has different verification approaches (for consensus)
(= (diverse-verification $user1 $user2)
(not (= $user1 $user2))
True)