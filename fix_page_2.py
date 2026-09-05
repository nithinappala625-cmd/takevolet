import re

with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    '''<p className="text-sm text-muted-foreground mb-4">
                  Configure dynamic fields for different categories. These fields will automatically appear on the website and app posting forms.
                </p>''',
    '''<p className="text-sm text-muted-foreground mb-4">
                  Configure dynamic fields for different categories. These fields will automatically appear on the website and app posting forms.
                  <br/><br/>
                  <strong>System Fields:</strong> Use the exact names <code>title</code>, <code>description</code>, <code>price</code>, <code>location</code>, or <code>images</code> to override the labels/ordering of default system fields.
                  <br/>
                  <strong>Booking Forms:</strong> Use the category ID <code>booking_form</code> to configure the fields asked during Bookings.
                </p>'''
)

# Also let's add `booking_form` to the select options
c = c.replace(
    '''<option value="marketplace">Marketplace</option>
                       </optgroup>''',
    '''<option value="marketplace">Marketplace</option>
                       </optgroup>
                       <optgroup label="System Forms">
                         <option value="booking_form">Booking Form Fields</option>
                       </optgroup>'''
)

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated Form builder text")
