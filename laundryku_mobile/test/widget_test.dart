import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:laundryku_mobile/main.dart';

void main() {
  group('LaundryOrder Model Contract Tests', () {
    test('Correctly maps Supabase PostgreSQL schema keys', () {
      final supabaseRow = {
        'id': 131,
        'kode_transaksi': 'TRX00131',
        'pelanggan_nama': 'Eko Prasetyo',
        'nomor_telepon': '081900112233',
        'layanan_nama': 'Cuci Setrika',
        'berat': 7.5,
        'total': 75000,
        'status_cucian': 'Dikeringkan',
        'status_pembayaran': 'Lunas',
        'tanggal_masuk': '2026-10-11',
        'estimasi_selesai': '2026-10-12',
        'catatan': 'Pisahkan kemeja putih',
        'metode_pembayaran': 'QRIS',
      };

      final order = LaundryOrder.fromMap(supabaseRow);

      expect(order.id, equals('TRX00131'));
      expect(order.pelanggan, equals('Eko Prasetyo'));
      expect(order.telepon, equals('081900112233'));
      expect(order.layanan, equals('Cuci Setrika'));
      expect(order.berat, equals(7.5));
      expect(order.total, equals(75000));
      expect(order.statusCucian, equals('Dikeringkan'));
      expect(order.pembayaran, equals('Lunas'));
      expect(order.tanggal, equals('2026-10-11'));
      expect(order.estimasi, equals('2026-10-12'));
      expect(order.catatan, equals('Pisahkan kemeja putih'));
      expect(order.metodeBayar, equals('QRIS'));
    });

    test('Correctly maps legacy and fallback payload format', () {
      final legacyRow = {
        'id': 'TRX999',
        'pelanggan': 'Siti Rahayu',
        'telepon': '08123456789',
        'layanan': 'Dry Clean',
        'berat': 3,
        'total': 45000,
        'statusCucian': 'Baru Masuk',
        'pembayaran': 'DP',
        'tanggal': '2026-10-10',
        'estimasi': '2026-10-11',
        'catatan': 'Express',
        'metode_bayar': 'Tunai',
      };

      final order = LaundryOrder.fromMap(legacyRow);

      expect(order.id, equals('TRX999'));
      expect(order.pelanggan, equals('Siti Rahayu'));
      expect(order.layanan, equals('Dry Clean'));
      expect(order.berat, equals(3.0));
      expect(order.total, equals(45000));
      expect(order.statusCucian, equals('Baru Masuk'));
      expect(order.pembayaran, equals('DP'));
      expect(order.metodeBayar, equals('Tunai'));
    });

    test('Provides safe default values for missing or null keys', () {
      final emptyRow = <String, dynamic>{};
      final order = LaundryOrder.fromMap(emptyRow);

      expect(order.id, equals('TRX000'));
      expect(order.pelanggan, equals('Pelanggan'));
      expect(order.telepon, equals('-'));
      expect(order.layanan, equals('Cuci Komplit'));
      expect(order.berat, equals(1.0));
      expect(order.total, equals(0));
      expect(order.statusCucian, equals('Baru Masuk'));
      expect(order.pembayaran, equals('Belum'));
      expect(order.catatan, equals('-'));
      expect(order.metodeBayar, isNull);
    });
  });

  group('LaundryKuApp Smoke Tests', () {
    testWidgets('App renders main navigation and header branding', (WidgetTester tester) async {
      await tester.pumpWidget(const LaundryKuApp());
      await tester.pump();

      // Verify header branding and navigation bar
      expect(find.text('LaundryKu Mobile'), findsOneWidget);
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('Dashboard'), findsWidgets);
      expect(find.text('Pelanggan'), findsWidgets);
    });
  });
}
