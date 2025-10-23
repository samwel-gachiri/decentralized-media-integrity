; Decentralized News Integrity - Base Knowledge
; Matches our actual backend models and database structure

; News categories from our backend models
(news-category politics)
(news-category economy)
(news-category technology)
(news-category health)
(news-category environment)
(news-category social)
(news-category international)
(news-category local)

    ; Media types from our backend
(media-type article)
(media-type video)
(media-type image)
(media-type social_media)
(media-type broadcast)

    ; User roles from our backend
(user-role user)
(user-role journalist)
(user-role fact_checker)

    ; Integrity levels from our backend
(integrity-level verified)
(integrity-level questionable)
(integrity-level debunked)
(integrity-level pending)

; Trust score system (matches User model)
(min-trust-score 0)
(max-trust-score 100)
(default-trust-score 50)

    ; Trust thresholds for actions
(trust-threshold verification 70)
(trust-threshold reporting 40)
(trust-threshold high-trust-verify 85)

    ; Misinformation categories for integrity correlation
(misinformation-type fake_news)
(misinformation-type deepfake)
(misinformation-type manipulated_media)
(misinformation-type biased_reporting)
(misinformation-type conspiracy_theory)

    ; Integrity severity levels for alerts
(integrity-severity low)
(integrity-severity medium)
(integrity-severity high)
(integrity-severity critical)

    ; Credibility scores for sources
(credibility-score reputable 0.9)
(credibility-score mainstream 0.7)
(credibility-score independent 0.5)
(credibility-score questionable 0.3)
(credibility-score unreliable 0.1)

; News category to misinformation mapping (for integrity correlation)
(category-misinformation politics fake_news)
(category-misinformation politics biased_reporting)
(category-misinformation health fake_news)
(category-misinformation health conspiracy_theory)
(category-misinformation technology manipulated_media)
(category-misinformation social manipulated_media)

    ; Media type to deepfake risk mapping
(media-deepfake-risk video high)
(media-deepfake-risk image medium)
(media-deepfake-risk article low)
(media-deepfake-risk social_media high)
(media-deepfake-risk broadcast medium)

; Verification rules
(max-news-age-hours 48)
(max-verification-distance 100)
(min-source-evidence true)
(min-fact-check-links 2)