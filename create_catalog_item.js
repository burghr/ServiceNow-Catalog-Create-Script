// =============================================================================
// Catalog Item Generator
// Run in: Scripts - Background (server-side)
//
// Usage: Define your catalog item config below and execute.
// It will create the catalog item, all variables, and optionally
// assign it to a category and catalog.
// =============================================================================

var config = {
    // -- Catalog Item Details --
    name: 'New Request',                   // UPDATE: your catalog item name
    short_description: '',                 // UPDATE: short description
    description: '',                       // UPDATE: full description
    category: '',                          // UPDATE: category name (must exist, or leave blank)
    catalog: 'Service Catalog',            // UPDATE: catalog name (must exist, or leave blank)
    workflow: '',                           // Workflow name (optional)
    active: true,
    availability: 'on_both',              // 'on_both', 'on_desktop', 'on_mobile'

    // -- Variable definitions --
    // Supported types:
    //   'string'          - Single line text
    //   'text'            - Multi-line text
    //   'integer'         - Number
    //   'boolean'         - Yes/No checkbox
    //   'date'            - Date picker
    //   'datetime'        - Date/Time picker
    //   'email'           - Email field
    //   'url'             - URL field
    //   'phone'           - Phone number
    //   'reference'       - Reference to a table
    //   'select'          - Dropdown (choice list)
    //   'multi_select'    - Multi-select (choice list)
    //   'checkbox'        - Checkbox
    //   'label'           - Label (read-only text / section divider)
    //   'break'           - Container break
    //   'macro'           - UI Macro
    //
    // Optional properties per variable:
    //   mandatory: true/false         - makes the field required
    //   default_value: 'value'        - sets a default value
    //   help_text: 'text'             - tooltip / help text
    //   reference: 'table_name'       - required for reference types
    //   reference_qualifier: 'query'  - encoded query filter for reference fields
    //   choices: [{value, label}]     - for select / multi_select types
    //   order: 100                    - display order on the form
    //
    variables: [
        {
            name: 'user',
            label: 'User',
            type: 'reference',
            reference: 'sys_user',
            reference_qualifier: 'active=true',
            mandatory: true,
            order: 101
        },
        {
            name: 'access_level',
            label: 'Access Level',
            type: 'select',
            mandatory: true,
            order: 200,
            choices: [
                { value: 'read_only', label: 'Read Only' },
                { value: 'standard', label: 'Standard User' },
                { value: 'power_user', label: 'Power User' },
                { value: 'admin', label: 'Administrator' }
            ]
        },
        {
            name: 'business_justification',
            label: 'Business justification',
            type: 'text',
            mandatory: true,
            order: 300
        },
        // {
        //     name: 'how_would_you_like_it',
        //     label: 'How would you like it?',
        //     type: 'select',
        //     mandatory: true,
        //     order: 400,
        //     choices: [
        //         { value: 'your_way', label: 'Your way' },
        //         { value: 'our_way', label: 'Our way' },
        //         { value: 'another_way', label: 'Another way' }
        //     ]
        // }
    ]
};

// =============================================================================
// Generator - No changes needed below
// =============================================================================

var typeMap = {
    'string':       1,
    'integer':      2,
    'boolean':      7,
    'checkbox':     7,
    'select':       5,
    'multi_select': 21,
    'reference':    8,
    'date':         9,
    'datetime':     10,
    'text':         6,
    'email':        31,
    'url':          18,
    'phone':        32,
    'label':        11,
    'break':        12,
    'macro':        14
};

try {
    // 1. Create the catalog item
    var catItemGr = new GlideRecord('sc_cat_item');
    catItemGr.initialize();
    catItemGr.setValue('name', config.name);
    catItemGr.setValue('short_description', config.short_description || '');
    catItemGr.setValue('description', config.description || '');
    catItemGr.setValue('active', config.active !== false);

    if (config.availability) {
        catItemGr.setValue('availability', config.availability);
    }

    // Assign to catalog
    if (config.catalog) {
        var catalogGr = new GlideRecord('sc_catalog');
        catalogGr.addQuery('title', config.catalog);
        catalogGr.setLimit(1);
        catalogGr.query();
        if (catalogGr.next()) {
            catItemGr.setValue('sc_catalogs', catalogGr.getUniqueValue());
        } else {
            gs.warn('Catalog "' + config.catalog + '" not found. Item will be created without catalog assignment.');
        }
    }

    // Assign to category
    if (config.category) {
        var categoryGr = new GlideRecord('sc_category');
        categoryGr.addQuery('title', config.category);
        categoryGr.setLimit(1);
        categoryGr.query();
        if (categoryGr.next()) {
            catItemGr.setValue('category', categoryGr.getUniqueValue());
        } else {
            gs.warn('Category "' + config.category + '" not found. Item will be created without category assignment.');
        }
    }

    // Assign workflow
    if (config.workflow) {
        var wfGr = new GlideRecord('wf_workflow');
        wfGr.addQuery('name', config.workflow);
        wfGr.setLimit(1);
        wfGr.query();
        if (wfGr.next()) {
            catItemGr.setValue('workflow', wfGr.getUniqueValue());
        } else {
            gs.warn('Workflow "' + config.workflow + '" not found.');
        }
    }

    var catItemId = catItemGr.insert();
    gs.info('Created catalog item: ' + config.name + ' (sys_id: ' + catItemId + ')');

    // 2. Create variables
    var variableCount = 0;
    for (var v = 0; v < config.variables.length; v++) {
        var varDef = config.variables[v];
        var varType = typeMap[varDef.type];

        if (varType === undefined) {
            gs.warn('Unknown variable type "' + varDef.type + '" for "' + (varDef.label || varDef.name) + '". Skipping.');
            continue;
        }

        var varGr = new GlideRecord('item_option_new');
        varGr.initialize();
        varGr.setValue('cat_item', catItemId);
        varGr.setValue('type', varType);
        varGr.setValue('question_text', varDef.label || varDef.name);
        varGr.setValue('order', varDef.order || (v * 100));
        varGr.setValue('mandatory', varDef.mandatory === true);

        // Name (not needed for labels/breaks)
        if (varDef.name) {
            varGr.setValue('name', varDef.name);
        }

        // Default value
        if (varDef.default_value !== undefined) {
            varGr.setValue('default_value', varDef.default_value);
        }

        // Help text / tooltip
        if (varDef.help_text) {
            varGr.setValue('help_text', varDef.help_text);
        }

        // Reference table for reference fields
        if (varDef.type === 'reference' && varDef.reference) {
            varGr.setValue('reference', varDef.reference);
        }

        // Reference qualifier
        if (varDef.reference_qualifier) {
            varGr.setValue('reference_qual', varDef.reference_qualifier);
        }

        // UI Macro
        if (varDef.type === 'macro' && varDef.macro) {
            varGr.setValue('macro', varDef.macro);
        }

        var varId = varGr.insert();
        variableCount++;

        // 3. Create choices for select / multi_select
        if (varDef.choices && varDef.choices.length > 0 && (varDef.type === 'select' || varDef.type === 'multi_select')) {
            for (var c = 0; c < varDef.choices.length; c++) {
                var choice = varDef.choices[c];
                var choiceGr = new GlideRecord('question_choice');
                choiceGr.initialize();
                choiceGr.setValue('question', varId);
                choiceGr.setValue('value', choice.value);
                choiceGr.setValue('text', choice.label || choice.value);
                choiceGr.setValue('order', (c + 1) * 100);
                choiceGr.insert();
            }
        }
    }

    gs.info('Created ' + variableCount + ' variable(s) for catalog item: ' + config.name);
    gs.info('Done! Navigate to: sc_cat_item.do?sys_id=' + catItemId);

} catch (ex) {
    gs.error('Error creating catalog item: ' + ex);
}
