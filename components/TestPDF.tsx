import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Minimal test component for debugging
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 12,
    marginBottom: 10,
  },
});

export const TestPDF = ({ message = "Hello PDF!" }: { message?: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Test PDF Component</Text>
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.text}>This is a minimal test component.</Text>
    </Page>
  </Document>
);

export default TestPDF;