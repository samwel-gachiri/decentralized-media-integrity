# MeTTa Knowledge Files

This directory contains the MeTTa knowledge base files for the Decentralized News Integrity Platform. These files define the core logic, rules, and knowledge used for news integrity verification and automated reasoning.

## File Structure

### 📄 `base_knowledge.metta`

Contains foundational knowledge about news integrity, trust scores, and system parameters.

**Key Components:**

- News integrity event type definitions (Misinformation, FakeNews, DeepFake, etc.)
- Trust score system (thresholds, defaults)
- Impact categories (Public_Misinformation, Media_Manipulation, etc.)
- Credibility levels (Low, Medium, High, Verified)
- Reward amounts for different credibility levels
- Geographic regions and news source mappings

### 📄 `verification_rules.metta`

Defines the core verification logic and rules for automated news integrity verification.

**Key Components:**

- Auto-verification rules based on evidence, cross-referencing, and trust scores
- Trust score update mechanisms
- Reward eligibility calculations
- News correlation and pattern detection
- Consensus verification logic
- Disinformation detection rules

### 📄 `climate_data.metta`

Contains news integrity knowledge, patterns, and domain expertise.

**Key Components:**

- News source credibility patterns by region
- Misinformation indicators and thresholds
- Economic impact calculations for fake news
- Vulnerability factors by media type
- Disinformation trends
- Early warning thresholds
- Fact-checking integration

### 📄 `helper_functions.metta`

Utility functions and mathematical operations used throughout the system.

**Key Components:**

- Source credibility calculations
- Time difference calculations for news timeliness
- Geographic boundary checks for regional news
- Metadata consistency validation
- Trust score calculations
- Reward adjustments and multipliers

## Loading Order

The files are loaded in the following order to ensure proper dependency resolution:

1. `base_knowledge.metta` - Foundation knowledge
2. `helper_functions.metta` - Utility functions
3. `climate_data.metta` - Domain-specific data
4. `verification_rules.metta` - Complex rules that depend on the above

## Usage

### Loading in Python

```python
from app.services.metta_service import NewsIntegrityKnowledgeBase

# Knowledge base automatically loads all .metta files
kb = NewsIntegrityKnowledgeBase()
```

### Validation

Use the MeTTa loader utility to validate files:

```bash
python metta_loader.py
```

### Testing

Run the demo to see the knowledge base in action:

```bash
python demo_metta.py
```

## MeTTa Syntax Examples

### Basic Facts

```metta
(news-integrity-type Misinformation)
(min-trust-score 60)
(reward-amount High 0.01)
```

### Rules with Logic

```metta
(= (auto-verify $news $user)
   (and (evidence-link $news $link)
        (cross-reference $news $source)
        (trust-score $user $score)
        (>= $score 60))
   (verified $news))
```

### Conditional Logic

```metta
(= (calculate-credibility $impact $sources)
   (cond ((> $impact 80) Verified)
         ((> $impact 60) High)
         ((> $impact 40) Medium)
         (True Low))
   $credibility)
```

## Extending the Knowledge Base

### Adding New News Integrity Types

1. Add to `base_knowledge.metta`:

   ```metta
   (news-integrity-type NewIntegrityType)
   ```

2. Add impact mapping:

   ```metta
   (news-impact-mapping NewIntegrityType SomeImpact)
   ```

3. Update verification rules if needed in `verification_rules.metta`

### Adding New Regions

1. Add region definition:

   ```metta
   (region "New Region, Country")
   ```

2. Add bounding box in `helper_functions.metta`:
   ```metta
   (region-bounds "New Region, Country" min-lat max-lat min-lng max-lng)
   ```

### Adding Custom Rules

Add new rules to `verification_rules.metta` following the pattern:

```metta
(= (rule-name $param1 $param2)
   (and (condition1 $param1)
        (condition2 $param2))
   (conclusion $result))
```

## Best Practices

1. **Comments**: Use `;` for comments to document complex rules
2. **Naming**: Use descriptive names with hyphens (kebab-case)
3. **Organization**: Group related facts and rules together
4. **Testing**: Always test new rules with the validation tools
5. **Dependencies**: Be aware of loading order for dependent rules

## Troubleshooting

### Common Issues

1. **Unbalanced Parentheses**: Every `(` must have a matching `)`
2. **Variable Naming**: Variables must start with `$`
3. **Rule Format**: Rules must follow `(= (head) (body) (conclusion))` format
4. **Loading Order**: Complex rules may fail if dependencies aren't loaded first

### Validation Tools

- `python metta_loader.py` - Interactive file validation
- `python run_metta_tests.py` - Automated testing
- `python demo_metta.py` - Live demonstration

## Integration

The MeTTa files are automatically loaded by the `NewsIntegrityKnowledgeBase` class and used throughout the Decentralized News Integrity Platform for:

- News verification
- Trust score management
- Reward calculations
- Pattern detection
- Disinformation prevention
- Early warning systems

Changes to these files will be reflected immediately when the system restarts.
