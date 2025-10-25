; Decentralized News Integrity - Helper Functions
; This file contains utility functions and mathematical operations for news verification

; Distance calculation (simplified Euclidean distance)
(= (distance $lat1 $lng1 $lat2 $lng2)
   (let* (($dlat (- $lat2 $lat1))
          ($dlng (- $lng2 $lng1))
          ($dlat-sq (* $dlat $dlat))
          ($dlng-sq (* $dlng $dlng))
          ($sum (+ $dlat-sq $dlng-sq)))
     ((py-atom math.sqrt) $sum)))

; Time difference calculation (in hours) for news timeliness
(= (time-diff $time1 $time2)
   (let* (($t1 (parse-time $time1))
          ($t2 (parse-time $time2))
          ($diff (- $t2 $t1))
          ($abs-diff (abs $diff))
          ($hours (/ $abs-diff 3600)))
     $hours))

; Check if news reports are within specified hours of each other
(= (within-hours $news1 $news2 $max-hours)
   (let* (($time1 (timestamp $news1))
          ($time2 (timestamp $news2))
          ($diff (time-diff $time1 $time2))
          ($check (<= $diff $max-hours)))
     $check))

; Check if two news reports are of the same type/category
(= (same-news-category $news1 $news2)
   (let* (($cat1 (news-category $news1))
          ($cat2 (news-category $news2))
          ($check (== $cat1 $cat2)))
     $check))

; Check if two news reports are at the same location (within 10km)
(= (same-location $news1 $news2)
   (let (gps-coords $news1 ($lat1 $lng1))
     (let (gps-coords $news2 ($lat2 $lng2))
       (let* (($dist (distance $lat1 $lng1 $lat2 $lng2))
              ($check (<= $dist 10)))
         $check))))

; Check if coordinates are within a region
(= (in-region $lat $lng $region)
   (let (region-bounds $region $min-lat $max-lat $min-lng $max-lng)
     (let* (($check1 (>= $lat $min-lat))
            ($check2 (<= $lat $max-lat))
            ($check3 (>= $lng $min-lng))
            ($check4 (<= $lng $max-lng))
            ($and1 (and $check1 (and $check2 $check3)))
            ($result (and $and1 (and $check4 True))))
       $result)))

; Region bounding boxes (approximate for major news regions)
(region-bounds "North America" 25 60 -125 -65)
(region-bounds "Europe" 35 70 -10 40)
(region-bounds "Asia" -10 80 25 180)
(region-bounds "Africa" -35 35 -20 55)
(region-bounds "South America" -55 15 -85 -35)
(region-bounds "Australia" -45 -10 110 155)

; Check if media metadata is consistent
(= (metadata-consistent $media-link $news-time $coords)
   (let* (($media-time (extract-media-time $media-link))
          ($diff (time-diff $news-time $media-time))
          ($check (<= $diff 2)))
     $check))

; Trust score validation (0-100 scale)
(= (valid-trust-score $score)
   (let* (($check1 (>= $score 0))
          ($check2 (<= $score 100))
          ($result (and $check1 (and $check2 True))))
     $result))

; Calculate trust score change based on verification accuracy
(= (trust-delta $accuracy)
   (if (<= $accuracy 0.5)
       -10
       (if (<= $accuracy 0.7)
           -2
           (if (<= $accuracy 0.9)
               5
               10))))

; News credibility calculation based on multiple factors
(= (calculate-credibility $source-credibility $cross-references $timeliness)
   (let* (($check1 (> $source-credibility 0.8))
          ($check2 (>= $cross-references 3))
          ($check3 (<= $timeliness 24))
          ($cond1 (and $check1 (and $check2 $check3))))
     (if $cond1
         0.95
         (let* (($check4 (> $source-credibility 0.6))
                ($check5 (>= $cross-references 2))
                ($check6 (<= $timeliness 48))
                ($cond2 (and $check4 (and $check5 $check6))))
           (if $cond2
               0.8
               (let* (($check7 (> $source-credibility 0.4))
                      ($check8 (>= $cross-references 1))
                      ($check9 (<= $timeliness 72))
                      ($cond3 (and $check7 (and $check8 $check9))))
                 (if $cond3
                     0.6
                     0.3)))))))

; Reward calculation with adjustments based on news integrity
(= (adjusted-reward $base-amount $trust-score $integrity-level $source-credibility)
   (let* (($trust-mult (trust-multiplier $trust-score))
          ($integrity-mult (integrity-multiplier $integrity-level))
          ($credibility-mult (credibility-multiplier $source-credibility))
          ($temp1 (* $base-amount $trust-mult))
          ($temp2 (* $temp1 $integrity-mult))
          ($final-amount (* $temp2 $credibility-mult)))
     $final-amount))

; Trust multiplier function
(= (trust-multiplier $score)
   (if (>= $score 90)
       1.5
       (if (>= $score 80)
           1.2
           (if (>= $score 60)
               1.0
               0.7))))

; Integrity multiplier function
(= (integrity-multiplier $integrity-level)
   (if (== $integrity-level verified)
       2.0
       (if (== $integrity-level high)
           1.5
           (if (== $integrity-level medium)
               1.0
               0.5))))

; Credibility multiplier function
(= (credibility-multiplier $credibility)
   (if (>= $credibility 0.9)
       1.3
       (if (>= $credibility 0.7)
           1.1
           (if (>= $credibility 0.5)
               1.0
               0.8))))

; News timeliness validation (within 1 week)
(= (timely-news $news)
   (let (timestamp $news $time)
     (let* (($now (current-time))
            ($age-hours (time-diff $time $now))
            ($check (<= $age-hours 168)))
       $check)))

; Check if users are different (for diverse verification)
(= (diverse-verification $user1 $user2)
   (not (== $user1 $user2)))