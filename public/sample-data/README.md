# Bulk Operations Sample Data Files

This directory contains sample data files for testing the bulk operations in the ZR Eats Bot Simulator.

## Available Sample Files

### Card Data Files
- **`bulk_cards_sample.txt`** - Text format for bulk card operations
  - Format: `cardNumber,cvv` (one per line)
  - Compatible with `/bulk_cards` and `/remove_bulk_cards` commands

- **`bulk_cards_sample.csv`** - CSV format for bulk card operations
  - AYCD-compatible CSV format with card numbers in column 6 and CVV in column 9
  - Compatible with `/bulk_cards` command

### Email Data Files
- **`bulk_emails_main_sample.txt`** - Sample emails for main pool
  - Format: One email address per line
  - Compatible with `/bulk_emails_main` and `/remove_bulk_emails` commands

- **`bulk_emails_pump20_sample.txt`** - Sample emails for pump_20off25 pool
  - Format: One email address per line
  - Compatible with `/bulk_emails_pump20` command

- **`bulk_emails_pump25_sample.txt`** - Sample emails for pump_25off pool
  - Format: One email address per line
  - Compatible with `/bulk_emails_pump25` command

## How to Use

1. **Download Sample Files**: Click the download links in the bot simulator when using bulk commands
2. **Upload Files**: When you type a bulk command (e.g., `/bulk_cards`), a file upload section will appear
3. **Select File**: Choose the appropriate sample file or your own file in the correct format
4. **Execute Command**: Click Send to process the bulk operation

## File Format Requirements

### Card Files (.txt)
```
4111111111111111,123
4222222222222222,456
4333333333333333,789
```

### Card Files (.csv)
Must have card numbers in column 6 (index 5) and CVV in column 9 (index 8):
```
ID,Name,Email,Phone,Address,Card Number,Expiry,CVV,ZIP,Status
1,John Doe,john@example.com,555-1234,123 Main St,4111111111111111,12/26,123,12345,Active
```

### Email Files (.txt)
```
user1@gmail.com
user2@yahoo.com
user3@hotmail.com
```

## Validation

- **Cards**: Validated using Luhn algorithm, 13-19 digits, proper CVV format
- **Emails**: Basic email format validation (must contain @ and domain)
- **Duplicates**: Automatically detected and skipped
- **Error Reporting**: Invalid entries are reported with line numbers

## Pool Management

### Email Pools
- **main**: Default email pool for general orders
- **pump_20off25**: Pump orders with 20% off $25+
- **pump_25off**: Pump orders with 25% off

### Commands by Pool
- `/bulk_emails_main` → main pool
- `/bulk_emails_pump20` → pump_20off25 pool
- `/bulk_emails_pump25` → pump_25off pool
- `/remove_bulk_emails` → specify pool with `pool:main` parameter

## Tips

1. **File Size**: Keep files under 1MB for optimal performance
2. **Validation**: Use the sample files as templates for your own data
3. **Testing**: Start with small sample files before uploading large datasets
4. **Authorization**: Bulk operations require admin authorization in the simulator
5. **Error Handling**: Check the response embed for detailed validation results