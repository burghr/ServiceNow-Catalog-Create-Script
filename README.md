# ServiceNow Catalog Item Generator

A background script that programmatically creates ServiceNow Service Catalog items with form variables. Define your catalog item as a config object and run it - no clicking through the UI.

## What It Does

1. Creates a catalog item with name, description, category, catalog, and workflow
2. Creates all form variables (text fields, dropdowns, reference fields, date pickers, etc.)
3. Creates dropdown choices for select/multi-select fields
4. Logs the sys_id and a direct link to the new item

## Usage

1. Open your ServiceNow instance
2. Navigate to **Scripts - Background**
3. Paste the script
4. Edit the `config` object at the top with your catalog item details and variables
5. Run it

## Supported Variable Types

| Type | Description |
|---|---|
| `string` | Single-line text |
| `text` | Multi-line text |
| `integer` | Number |
| `boolean` | Yes/No checkbox |
| `checkbox` | Checkbox |
| `date` | Date picker |
| `datetime` | Date/Time picker |
| `email` | Email field |
| `url` | URL field |
| `phone` | Phone number |
| `reference` | Reference to another table |
| `select` | Dropdown (single choice) |
| `multi_select` | Multi-select dropdown |
| `label` | Read-only label / section divider |
| `break` | Container break |
| `macro` | UI Macro |

## Variable Options

Each variable supports these optional properties:

```javascript
{
    name: 'field_name',             // Internal name
    label: 'Display Label',         // Label shown on the form
    type: 'string',                 // One of the types above
    mandatory: true,                // Required field
    default_value: 'value',         // Default value
    help_text: 'Tooltip text',      // Help text / tooltip
    order: 100,                     // Display order
    reference: 'sys_user',          // Table name (for reference type)
    reference_qualifier: 'active=true',  // Encoded query filter (for reference type)
    choices: [                      // For select / multi_select types
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' }
    ]
}
```

## Example

The script includes a sample config that creates a request form with a user reference field, an access level dropdown, and a business justification text area. Modify it to fit your needs.

## Notes

- The script looks up catalog, category, and workflow by name. If not found, it logs a warning and continues.
- Variables are created in the order specified by the `order` property.
- The script is safe to run multiple times, but it will create duplicate items - delete the old one first if re-running.
