import re

with open("takevolet app/lib/screens/build/add_build_listing_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update save method to extract from dynamic data
c = c.replace(
    '''        final data = {
          'user_id': user.id,
          'main_category': _mainCategory,
          'sub_category': _subCategory,
          'title': _titleController.text,
          'description': _descController.text,
          'price': double.tryParse(_priceController.text) ?? 0,
          'price_unit': _mainCategory == 'transport' ? 'per hour/day' : (_mainCategory == 'material' ? 'per unit' : 'contract/fixed'),
          'location_name': _locationName,
          'lat': _lat,
          'lng': _lng,
          'media_urls': uploadedUrls,
          'metadata': metadata,
          'dynamic_data': _dynamicData,
        };''',
    '''        
        final extractedTitle = _dynamicData['title']?.toString() ?? _titleController.text;
        final extractedDesc = _dynamicData['description']?.toString() ?? _descController.text;
        final extractedPrice = double.tryParse(_dynamicData['price']?.toString() ?? _priceController.text) ?? 0;
        final extractedLocation = _dynamicData['location']?.toString() ?? _locationName;

        // Clean up metadata so system fields aren't duplicated
        metadata.remove('title');
        metadata.remove('description');
        metadata.remove('price');
        metadata.remove('location');
        metadata.remove('images');

        final data = {
          'user_id': user.id,
          'main_category': _mainCategory,
          'sub_category': _subCategory,
          'title': extractedTitle,
          'description': extractedDesc,
          'price': extractedPrice,
          'price_unit': _mainCategory == 'transport' ? 'per hour/day' : (_mainCategory == 'material' ? 'per unit' : 'contract/fixed'),
          'location_name': extractedLocation,
          'lat': _lat,
          'lng': _lng,
          'media_urls': uploadedUrls,
          'metadata': metadata,
          'dynamic_data': _dynamicData,
        };'''
)

# 2. Hide hardcoded fields if they are present in dynamic schema
c = c.replace(
    '''              if (_mainCategory != null && _subCategory != null) ...[
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(labelText: 'Title / Name', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _priceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Price (₹)', border: OutlineInputBorder()),
                  validator: (v) => v!.isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 24),
                
                // --- Dynamic Form Renderer ---
                if (_isLoadingSchema) 
                  const Center(child: CircularProgressIndicator())
                else
                  DynamicFormWidget(
                    schema: _dynamicSchema,
                    initialData: _dynamicData,
                    onDataChanged: (newData) {
                      setState(() {
                        _dynamicData = newData;
                      });
                    },
                  ),
                const SizedBox(height: 24),
                
                const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),''',
    '''              if (_mainCategory != null && _subCategory != null) ...[
                // Only show hardcoded fields if they are NOT defined in the dynamic schema
                if (!_dynamicSchema.any((f) => f['key'] == 'title' || f['name'] == 'title')) ...[
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Title / Name', border: OutlineInputBorder()),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                ],
                if (!_dynamicSchema.any((f) => f['key'] == 'description' || f['name'] == 'description')) ...[
                  TextFormField(
                    controller: _descController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                ],
                if (!_dynamicSchema.any((f) => f['key'] == 'price' || f['name'] == 'price')) ...[
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Price (₹)', border: OutlineInputBorder()),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 24),
                ],
                
                // --- Dynamic Form Renderer ---
                if (_isLoadingSchema) 
                  const Center(child: CircularProgressIndicator())
                else
                  DynamicFormWidget(
                    schema: _dynamicSchema,
                    initialData: _dynamicData,
                    onDataChanged: (newData) {
                      setState(() {
                        _dynamicData = newData;
                      });
                    },
                  ),
                const SizedBox(height: 24),
                
                // Location Button (Hide if dynamic location field exists)
                if (!_dynamicSchema.any((f) => f['key'] == 'location' || f['name'] == 'location')) ...[
                  const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),'''
)

c = c.replace(
    '''                ElevatedButton.icon(
                  onPressed: _isLoadingLocation ? null : _getCurrentLocation,
                  icon: _isLoadingLocation ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator()) : const Icon(Icons.my_location),
                  label: Text(_locationName ?? 'Detect Location'),
                ),
                const SizedBox(height: 24),

                const Text('Photos (Up to 5)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),''',
    '''                ElevatedButton.icon(
                  onPressed: _isLoadingLocation ? null : _getCurrentLocation,
                  icon: _isLoadingLocation ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator()) : const Icon(Icons.my_location),
                  label: Text(_locationName ?? 'Detect Location'),
                ),
                const SizedBox(height: 24),
                ],

                // Photos (Hide if dynamic images field exists - future proofing)
                if (!_dynamicSchema.any((f) => f['key'] == 'images' || f['name'] == 'images')) ...[
                  const Text('Photos (Up to 5)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),'''
)

c = c.replace(
    '''                          ),
                        );
                      }).toList(),
                    ),
                  ),
              ],
            ],
          ),
        ),''',
    '''                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),'''
)


with open("takevolet app/lib/screens/build/add_build_listing_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated add_build_listing_screen.dart")
