import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/r2_storage_service.dart';

class AdminSponsoredBannersScreen extends StatefulWidget {
  const AdminSponsoredBannersScreen({super.key});

  @override
  State<AdminSponsoredBannersScreen> createState() => _AdminSponsoredBannersScreenState();
}

class _AdminSponsoredBannersScreenState extends State<AdminSponsoredBannersScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _banners = [];
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _fetchBanners();
  }

  Future<void> _fetchBanners() async {
    setState(() => _isLoading = true);
    try {
      final data = await Supabase.instance.client
          .from('sponsored_banners')
          .select()
          .order('display_order', ascending: true);
      setState(() {
        _banners = List<Map<String, dynamic>>.from(data);
      });
    } catch (e) {
      debugPrint('Error fetching banners: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addBanner() async {
    final titleController = TextEditingController();
    final shouldProceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Banner'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(labelText: 'Banner Title (e.g. 50% Off)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Select Image')),
        ],
      ),
    );

    if (shouldProceed != true) return;

    final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked == null) return;

    setState(() => _isLoading = true);
    try {
      final file = File(picked.path);
      final path = 'banners/${DateTime.now().millisecondsSinceEpoch}.jpg';
      final url = await R2StorageService.uploadFile(file, path);

      await Supabase.instance.client.from('sponsored_banners').insert({
        'banner_url': url,
        'title': titleController.text.isNotEmpty ? titleController.text : 'Sponsored Banner',
        'is_active': true,
      });
      await _fetchBanners();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleActive(String id, bool currentStatus) async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.from('sponsored_banners').update({'is_active': !currentStatus}).eq('id', id);
      await _fetchBanners();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
  
  Future<void> _deleteBanner(String id) async {
    setState(() => _isLoading = true);
    try {
      await Supabase.instance.client.from('sponsored_banners').delete().eq('id', id);
      await _fetchBanners();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Banners'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addBanner,
        icon: const Icon(Icons.add_photo_alternate),
        label: const Text('Upload Banner'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _banners.length,
              itemBuilder: (context, index) {
                final banner = _banners[index];
                return Card(
                  margin: const EdgeInsets.all(8),
                  child: ListTile(
                    leading: Image.network(banner['banner_url'], width: 80, fit: BoxFit.cover, errorBuilder: (c,e,s) => const Icon(Icons.image)),
                    title: Text(banner['title'] ?? 'No Title'),
                    subtitle: Text(banner['is_active'] ? 'Active' : 'Inactive', style: TextStyle(color: banner['is_active'] ? Colors.green : Colors.red)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Switch(
                          value: banner['is_active'] ?? false,
                          onChanged: (val) => _toggleActive(banner['id'], banner['is_active']),
                        ),
                        IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteBanner(banner['id'])),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
