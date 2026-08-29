class LegalConstants {
  static const List<String> categories = [
    'Property Lawyer',
    'Licensed Deed Writer',
    'Registration Consultant',
    'MeeSeva Center',
    'Tax Consultant',
    'Home Loan Consultant',
    'Notary Public',
    'RERA Consultant'
  ];

  static const Map<String, List<String>> specificCheckboxes = {
    'Property Lawyer': [
      'Legal Opinion', 'Document Verification', 'Title Verification',
      'Sale Agreement Drafting', 'Sale Deed Drafting', 'Property Dispute Handling',
      'NRI Property Services'
    ],
    'Licensed Deed Writer': [
      'Sale Deed Drafting', 'Gift Deed', 'Partition Deed', 'Release Deed',
      'Agreement Drafting', 'Mortgage Deed', 'Lease Deed'
    ],
    'Registration Consultant': [
      'Slot Booking Assistance', 'Registration Process', 'Stamp Duty Guidance',
      'Registration Fee Guidance', 'Property Registration', 'Land Registration',
      'Flat Registration'
    ],
    'MeeSeva Center': [
      'EC Certificate', 'Encumbrance Certificate', 'Mutation', 'Pattadar Passbook',
      'Property Tax', 'Aadhaar', 'PAN', 'Income Certificate', 'Caste Certificate',
      'Birth Certificate', 'Death Certificate', 'Ration Card', 'Land Records'
    ],
    'Tax Consultant': [
      'Property Tax', 'Capital Gains Tax', 'TDS on Property', 'NRI Taxation',
      'Income Tax Filing', 'GST Consultation'
    ],
    'Home Loan Consultant': [
      'Home Loan', 'Plot Loan', 'Construction Loan', 'Loan Against Property',
      'Balance Transfer', 'Top-Up Loan', 'Doorstep Service'
    ],
    'Notary Public': [
      'Affidavits', 'Agreement Notarization', 'Power of Attorney',
      'Property Affidavit', 'Document Attestation', 'Identity Verification'
    ],
    'RERA Consultant': [
      'RERA Registration', 'Builder Registration', 'Project Registration',
      'RERA Compliance', 'RERA Complaint Support', 'Project Documentation',
      'Approval Consultancy'
    ]
  };

  static const Map<String, List<String>> specificTextInputs = {
    'Property Lawyer': ['Bar Council Registration Number', 'Advocate Type', 'Property Specialization', 'Court Practicing'],
    'Licensed Deed Writer': ['License Number', 'Registration Office'],
    'Registration Consultant': ['Registration Office Covered'],
    'MeeSeva Center': [],
    'Tax Consultant': [],
    'Home Loan Consultant': ['Partner Banks', 'Maximum Loan Amount', 'Interest Rate Starts From'],
    'Notary Public': ['Notary Registration Number'],
    'RERA Consultant': []
  };
}
