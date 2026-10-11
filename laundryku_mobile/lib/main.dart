import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

// ============================================================
// KONFIGURASI SUPABASE CLOUD (SAMA PERSIS DENGAN WEB)
// ============================================================
const String supabaseUrl = 'https://bhopkqqehvnvrzzwnxqm.supabase.co';
const String supabaseAnonKey = 'sb_publishable_jnc8yj2Tpd02uMOM8Gybxg_gBOPPu61';

final currencyFormatter = NumberFormat.currency(
  locale: 'id_ID',
  symbol: 'Rp ',
  decimalDigits: 0,
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  } catch (e) {
    debugPrint('Supabase init warning: $e');
  }
  runApp(const LaundryKuApp());
}

// ============================================================
// MAIN APP & THEME
// ============================================================
typedef MyApp = LaundryKuApp;

class LaundryKuApp extends StatelessWidget {
  const LaundryKuApp({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFEB7F31);
    const secondaryColor = Color(0xFFFCAD38);

    return MaterialApp(
      title: 'LaundryKu Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryColor,
          primary: primaryColor,
          secondary: secondaryColor,
          surface: const Color(0xFFF8FAFC),
        ),
        fontFamily: GoogleFonts.poppins().fontFamily,
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1E293B),
          elevation: 0,
          titleTextStyle: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1E293B),
          ),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

// ============================================================
// MODEL TRANSAKSI
// ============================================================
class LaundryOrder {
  final String id;
  final String pelanggan;
  final String telepon;
  final String layanan;
  final double berat;
  final int total;
  String statusCucian;
  String pembayaran;
  final String tanggal;
  final String estimasi;
  final String catatan;
  String? metodeBayar;

  LaundryOrder({
    required this.id,
    required this.pelanggan,
    required this.telepon,
    required this.layanan,
    required this.berat,
    required this.total,
    required this.statusCucian,
    required this.pembayaran,
    required this.tanggal,
    required this.estimasi,
    this.catatan = '-',
    this.metodeBayar,
  });

  factory LaundryOrder.fromMap(Map<String, dynamic> map) {
    return LaundryOrder(
      id: map['kode_transaksi']?.toString() ?? map['id']?.toString() ?? 'TRX000',
      pelanggan: map['pelanggan_nama']?.toString() ?? map['pelanggan']?.toString() ?? 'Pelanggan',
      telepon: map['nomor_telepon']?.toString() ?? map['telepon']?.toString() ?? '-',
      layanan: map['layanan_nama']?.toString() ?? map['layanan']?.toString() ?? 'Cuci Komplit',
      berat: (map['berat'] as num?)?.toDouble() ?? 1.0,
      total: (map['total'] as num?)?.toInt() ?? 0,
      statusCucian: map['status_cucian']?.toString() ?? map['statusCucian']?.toString() ?? 'Baru Masuk',
      pembayaran: map['status_pembayaran']?.toString() ?? map['pembayaran']?.toString() ?? 'Belum',
      tanggal: map['tanggal_masuk']?.toString() ?? map['tanggal']?.toString() ?? '',
      estimasi: map['estimasi_selesai']?.toString() ?? map['estimasi']?.toString() ?? '',
      catatan: map['catatan']?.toString() ?? '-',
      metodeBayar: map['metode_pembayaran']?.toString() ?? map['metode_bayar']?.toString() ?? map['metodeBayar']?.toString(),
    );
  }
}

// ============================================================
// MAIN NAVIGATION (BOTTOM TABS)
// ============================================================
class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  List<LaundryOrder> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final client = Supabase.instance.client;
      final response = await client
          .from('transaksi')
          .select()
          .order('id', ascending: false);

      if (response.isNotEmpty) {
        _orders = (response as List).map((e) => LaundryOrder.fromMap(e)).toList();
      } else {
        _loadFallbackData();
      }
    } catch (e) {
      debugPrint('Fetch orders warning, using fallback: $e');
      _loadFallbackData();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _loadFallbackData() {
    _orders = [
      LaundryOrder(
        id: 'TRX001',
        pelanggan: 'Budi Santoso',
        telepon: '081234567890',
        layanan: 'Cuci Komplit Reguler',
        berat: 4.5,
        total: 36000,
        statusCucian: 'Siap Diambil',
        pembayaran: 'Belum',
        tanggal: '2026-09-28',
        estimasi: '2026-09-29',
      ),
      LaundryOrder(
        id: 'TRX002',
        pelanggan: 'Siti Rahma',
        telepon: '082198765432',
        layanan: 'Cuci Kering Lipat',
        berat: 3.0,
        total: 18000,
        statusCucian: 'Dicuci',
        pembayaran: 'Lunas',
        tanggal: '2026-09-29',
        estimasi: '2026-09-30',
        metodeBayar: 'QRIS',
      ),
      LaundryOrder(
        id: 'TRX003',
        pelanggan: 'Ahmad Fauzi',
        telepon: '085712345678',
        layanan: 'Setrika Uap Premium',
        berat: 5.0,
        total: 35000,
        statusCucian: 'Disetrika',
        pembayaran: 'DP',
        tanggal: '2026-09-29',
        estimasi: '2026-09-30',
        metodeBayar: 'Tunai',
      ),
      LaundryOrder(
        id: 'TRX004',
        pelanggan: 'Rina Kusuma',
        telepon: '081399887766',
        layanan: 'Cuci Komplit Express',
        berat: 2.0,
        total: 24000,
        statusCucian: 'Selesai',
        pembayaran: 'Lunas',
        tanggal: '2026-09-27',
        estimasi: '2026-09-28',
        metodeBayar: 'Tunai',
      ),
    ];
  }

  Future<void> _updateOrderStatus(LaundryOrder order, String newStatus) async {
    setState(() {
      order.statusCucian = newStatus;
    });

    try {
      final client = Supabase.instance.client;
      final updateData = <String, dynamic>{
        'status_cucian': newStatus,
      };
      if (newStatus == 'Selesai') {
        updateData['tanggal_selesai'] = DateTime.now().toIso8601String().split('T')[0];
      }
      await client.from('transaksi').update(updateData).eq('kode_transaksi', order.id);
    } catch (e) {
      debugPrint('Update status error: $e');
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Status #${order.id} diubah ke "$newStatus"'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _settlePayment(LaundryOrder order, String newPayment, String method) async {
    setState(() {
      order.pembayaran = newPayment;
      order.metodeBayar = method;
    });

    try {
      final client = Supabase.instance.client;
      await client.from('transaksi').update({
        'status_pembayaran': newPayment,
        'metode_pembayaran': method,
      }).eq('kode_transaksi', order.id);
    } catch (e) {
      debugPrint('Settle payment error: $e');
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Pembayaran #${order.id} berhasil ($newPayment - $method)'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _sendWhatsAppReminder(LaundryOrder order) async {
    String phone = order.telepon.replaceAll(RegExp(r'[^0-9]'), '');
    if (phone.startsWith('0')) phone = '62${phone.substring(1)}';
    if (phone.isEmpty) return;

    final message = Uri.encodeComponent(
      'Halo Kak ${order.pelanggan}, cucian Anda di LaundryKu (#${order.id} - ${order.layanan}) sudah SIAP DIAMBIL di kasir. Total tagihan: ${currencyFormatter.format(order.total)} (${order.pembayaran}). Terima kasih!',
    );

    final url = Uri.parse('https://wa.me/$phone?text=$message');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(url);
      }
    } catch (e) {
      debugPrint('WhatsApp launch error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardTab(
        orders: _orders,
        isLoading: _isLoading,
        onRefresh: _loadOrders,
        onSendWa: _sendWhatsAppReminder,
      ),
      StatusCucianTab(
        orders: _orders,
        isLoading: _isLoading,
        onRefresh: _loadOrders,
        onAdvanceStatus: _updateOrderStatus,
        onSendWa: _sendWhatsAppReminder,
      ),
      KasirPembayaranTab(
        orders: _orders,
        isLoading: _isLoading,
        onRefresh: _loadOrders,
        onSettle: _settlePayment,
        onSendWa: _sendWhatsAppReminder,
      ),
      PelangganTab(
        orders: _orders,
        isLoading: _isLoading,
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFFFEDD5),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: Color(0xFFEB7F31)),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_laundry_service_outlined),
            selectedIcon: Icon(Icons.local_laundry_service, color: Color(0xFFEB7F31)),
            label: 'Cucian',
          ),
          NavigationDestination(
            icon: Icon(Icons.point_of_sale_outlined),
            selectedIcon: Icon(Icons.point_of_sale, color: Color(0xFFEB7F31)),
            label: 'Kasir POS',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: Color(0xFFEB7F31)),
            label: 'Pelanggan',
          ),
        ],
      ),
    );
  }
}

// ============================================================
// TAB 1: DASHBOARD
// ============================================================
class DashboardTab extends StatelessWidget {
  final List<LaundryOrder> orders;
  final bool isLoading;
  final Future<void> Function() onRefresh;
  final Function(LaundryOrder) onSendWa;

  const DashboardTab({
    super.key,
    required this.orders,
    required this.isLoading,
    required this.onRefresh,
    required this.onSendWa,
  });

  @override
  Widget build(BuildContext context) {
    final totalTrx = orders.length;
    final diproses = orders.where((o) => ['Dicuci', 'Dikeringkan', 'Disetrika'].contains(o.statusCucian)).length;
    final siapDiambil = orders.where((o) => o.statusCucian == 'Siap Diambil').length;
    final selesai = orders.where((o) => o.statusCucian == 'Selesai').length;
    final totalOmzet = orders.fold<int>(0, (sum, o) => sum + o.total);

    final readyOrders = orders.where((o) => o.statusCucian == 'Siap Diambil').toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFEB7F31),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.local_laundry_service, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('LaundryKu Mobile', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
                Text('Sistem Kasir & Tracking', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: onRefresh,
            tooltip: 'Segarkan Data',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Omzet Banner
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFEB7F31), Color(0xFFFCAD38)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFEB7F31).withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Omzet Penjualan', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 6),
                  Text(
                    currencyFormatter.format(totalOmzet),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.verified, color: Colors.white, size: 16),
                      const SizedBox(width: 6),
                      Text('$totalTrx Total Riwayat Transaksi', style: const TextStyle(color: Colors.white, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // 4 Grid Metric Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildStatCard('Diproses', diproses.toString(), Icons.autorenew, const Color(0xFFEA580C), const Color(0xFFFFF7ED)),
                _buildStatCard('Siap Diambil', siapDiambil.toString(), Icons.check_circle_outline, const Color(0xFF8B5CF6), const Color(0xFFF5F3FF)),
                _buildStatCard('Selesai', selesai.toString(), Icons.task_alt, const Color(0xFF10B981), const Color(0xFFECFDF5)),
                _buildStatCard('Total Pesanan', totalTrx.toString(), Icons.receipt_long, const Color(0xFF2563EB), const Color(0xFFEFF6FF)),
              ],
            ),

            const SizedBox(height: 22),

            // Urgent / Ready for Pickup Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Perlu Perhatian (${readyOrders.length})',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                ),
                Text(
                  'Siap Diambil',
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF8B5CF6), fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (readyOrders.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Text('🎉 Tidak ada cucian yang menumpuk siap diambil!'),
              )
            else
              ...readyOrders.map((o) => _buildUrgentOrderCard(context, o, onSendWa)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 16),
              ),
            ],
          ),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }

  Widget _buildUrgentOrderCard(BuildContext context, LaundryOrder o, Function(LaundryOrder) onSendWa) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F3FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.alarm, color: Color(0xFF8B5CF6), size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(o.pelanggan, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  Text('${o.layanan} • ${o.berat} kg', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                  Text('Tagihan: ${currencyFormatter.format(o.total)} (${o.pembayaran})',
                      style: const TextStyle(color: Color(0xFFEB7F31), fontWeight: FontWeight.w600, fontSize: 12)),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
              onPressed: () => onSendWa(o),
              tooltip: 'Kirim WhatsApp Siap Diambil',
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// TAB 2: STATUS CUCIAN (KANBAN TABS)
// ============================================================
class StatusCucianTab extends StatelessWidget {
  final List<LaundryOrder> orders;
  final bool isLoading;
  final Future<void> Function() onRefresh;
  final Function(LaundryOrder, String) onAdvanceStatus;
  final Function(LaundryOrder) onSendWa;

  const StatusCucianTab({
    super.key,
    required this.orders,
    required this.isLoading,
    required this.onRefresh,
    required this.onAdvanceStatus,
    required this.onSendWa,
  });

  static const stages = [
    'Semua',
    'Baru Masuk',
    'Dicuci',
    'Dikeringkan',
    'Disetrika',
    'Siap Diambil',
    'Selesai',
  ];

  static const nextStageMap = {
    'Baru Masuk': 'Dicuci',
    'Dicuci': 'Dikeringkan',
    'Dikeringkan': 'Disetrika',
    'Disetrika': 'Siap Diambil',
    'Siap Diambil': 'Selesai',
  };

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: stages.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Status & Alur Cucian'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: onRefresh),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: const Color(0xFFEB7F31),
            unselectedLabelColor: const Color(0xFF64748B),
            indicatorColor: const Color(0xFFEB7F31),
            tabs: stages.map((s) {
              final count = s == 'Semua' ? orders.length : orders.where((o) => o.statusCucian == s).length;
              return Tab(text: '$s ($count)');
            }).toList(),
          ),
        ),
        body: TabBarView(
          children: stages.map((stage) {
            final filtered = stage == 'Semua' ? orders : orders.where((o) => o.statusCucian == stage).toList();

            if (filtered.isEmpty) {
              return Center(
                child: Text('Tidak ada cucian di tahap "$stage"', style: const TextStyle(color: Color(0xFF94A3B8))),
              );
            }

            return RefreshIndicator(
              onRefresh: onRefresh,
              child: ListView.builder(
                padding: const EdgeInsets.all(14),
                itemCount: filtered.length,
                itemBuilder: (context, idx) {
                  final o = filtered[idx];
                  final nextStage = nextStageMap[o.statusCucian];

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('#${o.id}', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700, color: Color(0xFF64748B))),
                              _buildStatusBadge(o.statusCucian),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(o.pelanggan, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          Text('${o.layanan} • ${o.berat} kg', style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                          const Divider(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(currencyFormatter.format(o.total), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFFEB7F31))),
                              Row(
                                children: [
                                  if (o.statusCucian == 'Siap Diambil')
                                    IconButton(
                                      icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                                      onPressed: () => onSendWa(o),
                                      tooltip: 'Kirim WhatsApp',
                                    ),
                                  if (nextStage != null)
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFEB7F31),
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      icon: const Icon(Icons.arrow_forward, size: 14),
                                      label: Text(nextStage, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                      onPressed: () => onAdvanceStatus(o, nextStage),
                                    )
                                  else
                                    const Text('✓ Selesai Diambil', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w600, fontSize: 12)),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = const Color(0xFFF1F5F9);
    Color txt = const Color(0xFF475569);

    if (status == 'Baru Masuk') {
      bg = const Color(0xFFFFF7ED);
      txt = const Color(0xFFEA580C);
    } else if (['Dicuci', 'Dikeringkan', 'Disetrika'].contains(status)) {
      bg = const Color(0xFFFEF3C7);
      txt = const Color(0xFFD97706);
    } else if (status == 'Siap Diambil') {
      bg = const Color(0xFFF5F3FF);
      txt = const Color(0xFF8B5CF6);
    } else if (status == 'Selesai') {
      bg = const Color(0xFFECFDF5);
      txt = const Color(0xFF10B981);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(status, style: TextStyle(color: txt, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

// ============================================================
// TAB 3: KASIR & PEMBAYARAN POS
// ============================================================
class KasirPembayaranTab extends StatelessWidget {
  final List<LaundryOrder> orders;
  final bool isLoading;
  final Future<void> Function() onRefresh;
  final Function(LaundryOrder, String, String) onSettle;
  final Function(LaundryOrder) onSendWa;

  const KasirPembayaranTab({
    super.key,
    required this.orders,
    required this.isLoading,
    required this.onRefresh,
    required this.onSettle,
    required this.onSendWa,
  });

  void _openSettleBottomSheet(BuildContext context, LaundryOrder o) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SettleModalSheet(order: o, onSettle: onSettle),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unpaidOrders = orders.where((o) => o.pembayaran != 'Lunas').toList();
    final paidOrders = orders.where((o) => o.pembayaran == 'Lunas').toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Kasir & Pembayaran POS'),
          actions: [
            IconButton(icon: const Icon(Icons.refresh), onPressed: onRefresh),
          ],
          bottom: TabBar(
            labelColor: const Color(0xFFEB7F31),
            unselectedLabelColor: const Color(0xFF64748B),
            indicatorColor: const Color(0xFFEB7F31),
            tabs: [
              Tab(text: 'Belum Lunas / Piutang (${unpaidOrders.length})'),
              Tab(text: 'Lunas (${paidOrders.length})'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrderList(context, unpaidOrders, isUnpaid: true),
            _buildOrderList(context, paidOrders, isUnpaid: false),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderList(BuildContext context, List<LaundryOrder> list, {required bool isUnpaid}) {
    if (list.isEmpty) {
      return Center(
        child: Text(
          isUnpaid ? '🎉 Tidak ada tagihan yang tertunda!' : 'Belum ada riwayat pelunasan.',
          style: const TextStyle(color: Color(0xFF94A3B8)),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(14),
        itemCount: list.length,
        itemBuilder: (context, idx) {
          final o = list[idx];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isUnpaid ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isUnpaid ? Icons.money_off : Icons.check_circle,
                      color: isUnpaid ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.pelanggan, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                        Text('#${o.id} • ${o.layanan}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                        Text('Tagihan: ${currencyFormatter.format(o.total)}',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFFEB7F31))),
                      ],
                    ),
                  ),
                  if (isUnpaid)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () => _openSettleBottomSheet(context, o),
                      child: const Text('Bayar', style: TextStyle(fontWeight: FontWeight.w700)),
                    )
                  else
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('LUNAS', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w800, fontSize: 12)),
                        Text(o.metodeBayar ?? 'Tunai', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ============================================================
// MODAL BOTTOM SHEET: KASIR PELUNASAN POS
// ============================================================
class SettleModalSheet extends StatefulWidget {
  final LaundryOrder order;
  final Function(LaundryOrder, String, String) onSettle;

  const SettleModalSheet({super.key, required this.order, required this.onSettle});

  @override
  State<SettleModalSheet> createState() => _SettleModalSheetState();
}

class _SettleModalSheetState extends State<SettleModalSheet> {
  final String _settleType = 'Lunas';
  String _method = 'Tunai';
  final TextEditingController _cashController = TextEditingController();
  int _cashReceived = 0;

  @override
  void initState() {
    super.initState();
    _cashReceived = widget.order.total;
    _cashController.text = _cashReceived.toString();
  }

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final change = _cashReceived - widget.order.total;

    return Padding(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Kasir Pelunasan #${widget.order.id}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.order.pelanggan, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('${widget.order.layanan} (${widget.order.berat} kg)', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
                Text(currencyFormatter.format(widget.order.total),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFFEB7F31))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Metode Pembayaran:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: ['Tunai', 'QRIS', 'Transfer'].map((m) {
              final isSel = _method == m;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: isSel ? const Color(0xFFFFF7ED) : Colors.white,
                      side: BorderSide(color: isSel ? const Color(0xFFEB7F31) : const Color(0xFFCBD5E1), width: isSel ? 2 : 1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => setState(() => _method = m),
                    child: Text(m, style: TextStyle(color: isSel ? const Color(0xFFEB7F31) : const Color(0xFF1E293B), fontWeight: FontWeight.w600)),
                  ),
                ),
              );
            }).toList(),
          ),
          if (_method == 'Tunai') ...[
            const SizedBox(height: 14),
            const Text('Uang Diterima (Rp):', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _cashController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: 'Rp ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              onChanged: (val) {
                setState(() {
                  _cashReceived = int.tryParse(val) ?? 0;
                });
              },
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: change >= 0 ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(change >= 0 ? 'Kembalian:' : 'Uang Kurang:', style: TextStyle(color: change >= 0 ? const Color(0xFF065F46) : const Color(0xFF991B1B), fontWeight: FontWeight.w600)),
                  Text(currencyFormatter.format(change.abs()), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: change >= 0 ? const Color(0xFF10B981) : const Color(0xFFDC2626))),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.pop(context);
                widget.onSettle(widget.order, _settleType, _method);
              },
              child: const Text('Simpan Pembayaran (Lunas)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// TAB 4: PELANGGAN
// ============================================================
class PelangganTab extends StatelessWidget {
  final List<LaundryOrder> orders;
  final bool isLoading;

  const PelangganTab({super.key, required this.orders, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    // Unique customers
    final customerMap = <String, LaundryOrder>{};
    for (var o in orders) {
      if (!customerMap.containsKey(o.pelanggan)) {
        customerMap[o.pelanggan] = o;
      }
    }
    final customers = customerMap.values.toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daftar Pelanggan'),
      ),
      body: customers.isEmpty
          ? const Center(child: Text('Belum ada pelanggan terdaftar.'))
          : ListView.builder(
              padding: const EdgeInsets.all(14),
              itemCount: customers.length,
              itemBuilder: (context, idx) {
                final c = customers[idx];
                final initial = c.pelanggan.isNotEmpty ? c.pelanggan[0].toUpperCase() : 'U';

                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  color: Colors.white,
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFFEB7F31),
                      foregroundColor: Colors.white,
                      child: Text(initial, style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                    title: Text(c.pelanggan, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(c.telepon, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                    trailing: IconButton(
                      icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                      onPressed: () async {
                        String phone = c.telepon.replaceAll(RegExp(r'[^0-9]'), '');
                        if (phone.startsWith('0')) phone = '62${phone.substring(1)}';
                        final url = Uri.parse('https://wa.me/$phone?text=Halo%20Kak%20${Uri.encodeComponent(c.pelanggan)},%20kami%20dari%20LaundryKu...');
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        }
                      },
                      tooltip: 'Chat WhatsApp',
                    ),
                  ),
                );
              },
            ),
    );
  }
}
