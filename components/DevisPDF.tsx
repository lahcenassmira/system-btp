import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Register fonts if needed
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    objectFit: 'contain',
  },
  companyInfo: {
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2563eb',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 120,
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #e5e7eb',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #000',
    paddingTop: 8,
    textAlign: 'center',
  },
});

interface DevisPDFProps {
  devis: any;
  settings: any;
}

const DevisPDF: React.FC<DevisPDFProps> = ({ devis, settings }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {settings?.logo && (
              <Image src={settings.logo} style={styles.logo} />
            )}
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 10 }}>
              {settings?.shopName || 'Votre Entreprise'}
            </Text>
            {settings?.address && <Text>{settings.address}</Text>}
            {settings?.phone && <Text>Tél: {settings.phone}</Text>}
            {settings?.email && <Text>Email: {settings.email}</Text>}
            {settings?.ice && <Text>ICE: {settings.ice}</Text>}
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
              DEVIS N° {devis.devisNumber}
            </Text>
            <Text>Date: {formatDate(devis.createdAt)}</Text>
            {devis.validUntil && (
              <Text>Valable jusqu'au: {formatDate(devis.validUntil)}</Text>
            )}
            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
              Statut: {devis.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>DEVIS</Text>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS CLIENT</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom:</Text>
            <Text style={styles.value}>{devis.clientName}</Text>
          </View>
          {devis.clientCompany && (
            <View style={styles.row}>
              <Text style={styles.label}>Société:</Text>
              <Text style={styles.value}>{devis.clientCompany}</Text>
            </View>
          )}
          {devis.clientPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone:</Text>
              <Text style={styles.value}>{devis.clientPhone}</Text>
            </View>
          )}
          {devis.clientEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{devis.clientEmail}</Text>
            </View>
          )}
          {devis.clientAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresse:</Text>
              <Text style={styles.value}>{devis.clientAddress}</Text>
            </View>
          )}
        </View>

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS CHANTIER</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom du chantier:</Text>
            <Text style={styles.value}>{devis.chantierName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Localisation:</Text>
            <Text style={styles.value}>{devis.location}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Unité</Text>
            <Text style={styles.col3}>Quantité</Text>
            <Text style={styles.col4}>Prix Unit.</Text>
            <Text style={styles.col5}>Total</Text>
          </View>
          {devis.items.map((item: any, index: number) => (
            <View
              key={index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.unit}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.col5}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(devis.totalHT)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              TVA ({devis.tvaRate}%):
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(devis.tva)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>TOTAL TTC:</Text>
            <Text>{formatCurrency(devis.totalTTC)}</Text>
          </View>
        </View>

        {/* Notes */}
        {devis.notes && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes:</Text>
            <Text>{devis.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, textAlign: 'center', color: '#6b7280' }}>
            Ce devis est valable pour une durée de 30 jours à compter de la date d'émission.
          </Text>
          <Text style={{ fontSize: 8, textAlign: 'center', color: '#6b7280', marginTop: 4 }}>
            Conditions de paiement: selon accord commercial
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text>Signature du client</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Signature de l'entreprise</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default DevisPDF;
