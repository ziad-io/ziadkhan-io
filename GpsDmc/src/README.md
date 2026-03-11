# GPS Harkay DMC Management System

A comprehensive web-based DMC (Detailed Marks Certificate) Management System for GPS Harkay, Class 5th, built with modern web technologies.

## Features

### 🎯 Core Functionality
- **Student Data Entry**: Complete student information form with marks entry
- **Automated Calculations**: Real-time calculation of total marks, percentage, and grades
- **DMC Generation**: Professional printable DMC certificates
- **Record Management**: Search, view, and delete student records
- **Analytics Dashboard**: Visual charts and class statistics

### 📊 Analytics & Reporting
- **Result Summary Chart**: Pie chart showing grade distribution
- **Top 3 Students**: Automatic ranking based on performance
- **Class Statistics**: Average percentage, pass rate, total students
- **Real-time Updates**: Analytics update automatically with data changes

### 🎨 Professional Features
- **Modern UI**: Clean, responsive design with professional styling
- **Data Validation**: Input validation for marks and required fields
- **Local Storage**: Persistent data storage using browser localStorage
- **Print-Ready DMC**: Optimized layout for printing certificates
- **Grade System**: A+ ≥90%, A ≥80%, B ≥70%, C ≥50%, Fail <50%
- **Fail Rule**: Any subject <33 marks = Fail (even if overall percentage passes)

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **Storage**: Browser localStorage for data persistence
- **Design**: Responsive CSS Grid and Flexbox layouts
- **Fonts**: Google Fonts (Segoe UI)

## File Structure

```
GPS-Harkay-DMC-System/
├── index.html          # Main application file
├── styles.css          # Complete styling and responsive design
├── script.js           # All JavaScript functionality
└── README.md           # This documentation
```

## Installation & Setup

1. **Download/Clone** the project files to your local directory
2. **Open** `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
3. **No additional setup required** - everything runs client-side

## Usage Guide

### 1. Adding Student Records
1. Navigate to the **Dashboard** tab
2. Fill in all student information fields
3. Enter marks for all 5 subjects (English, Maths, Pak Study, Islamiat, Pashto)
4. Click **SAVE** to store the record

### 2. Searching Students
1. Click the **SEARCH** button on the Dashboard
2. Enter the Roll Number in the modal
3. Click **Search** to load student data back to the form

### 3. Generating DMC Certificates
1. Enter student data or search for an existing student
2. Click **PRINT DMC** button
3. The system will automatically switch to DMC tab and generate the certificate
4. Use browser's print function (Ctrl+P) to print the certificate

### 4. Viewing Records
1. Navigate to **Student Records** tab
2. View all stored student records in a sortable table
3. Use **Load** button to edit existing records
4. Use **Delete** button to remove records

### 5. Analytics Dashboard
1. View **Result Summary** pie chart on Dashboard
2. Check **Top 3 Students** for class performance
3. Monitor **Class Statistics** for overall performance metrics

## Grading System

### Grade Criteria
- **A+**: 90% and above
- **A**: 80% - 89.9%
- **B**: 70% - 79.9%
- **C**: 50% - 69.9%
- **Fail**: Below 50% OR any subject below 33 marks

### Fail Rule Implementation
The system follows the strict fail rule: if a student scores less than 33 marks in ANY subject, they will be marked as **Fail** regardless of their overall percentage.

## Data Management

### Data Storage
- All student data is stored in browser's localStorage
- Data persists between browser sessions
- No server or database required

### Data Export/Import
- **Export**: Use browser's developer tools to export localStorage data
- **Import**: Can import data by setting localStorage programmatically

### Data Fields
Each student record contains:
- Roll Number (unique identifier)
- Student Name
- Father Name
- Class (fixed: 5th)
- Section (A or B)
- Subject Marks (English, Maths, Pak Study, Islamiat, Pashto)
- Total Marks (calculated)
- Percentage (calculated)
- Grade (calculated)

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### Required Features
- JavaScript ES6+ support
- localStorage support
- CSS Grid and Flexbox support
- Chart.js library (loaded via CDN)

## Security & Privacy

### Data Privacy
- All data is stored locally in the browser
- No data is transmitted to external servers
- Complete offline functionality

### Data Validation
- Input validation for all form fields
- Marks range validation (0-100)
- Duplicate roll number prevention
- Required field validation

## Customization

### Styling Customization
- Edit `styles.css` for visual changes
- Color scheme uses CSS variables for easy modification
- Responsive design adapts to different screen sizes

### Functional Customization
- Modify grading logic in `script.js` `calculateGrade()` method
- Add new subjects by extending the form and calculation logic
- Customize DMC layout in `generateDMCHTML()` method

## Troubleshooting

### Common Issues

**Data not saving?**
- Check browser localStorage is enabled
- Ensure browser is not in private/incognito mode

**Charts not displaying?**
- Verify Chart.js CDN is accessible
- Check browser console for JavaScript errors

**DMC not printing correctly?**
- Use browser's print preview to adjust settings
- Ensure "Background graphics" is enabled in print settings

**Form validation errors?**
- Fill all required fields marked with asterisks
- Ensure marks are between 0-100 range

### Performance Tips
- For large datasets (>1000 students), consider implementing pagination
- Regularly clean up old records to maintain performance
- Use modern browsers for best performance

## Future Enhancements

### Planned Features
- [ ] Data export to Excel/CSV
- [ ] Bulk student import
- [ ] Advanced search and filtering
- [ ] Multiple class support
- [ ] Subject-wise analytics
- [ ] Student attendance tracking
- [ ] Parent portal access

### Technical Improvements
- [ ] Progressive Web App (PWA) support
- [ ] Offline-first architecture
- [ ] IndexedDB for larger datasets
- [ ] Cloud synchronization option

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Verify browser compatibility
3. Test with a fresh browser session
4. Clear browser cache if needed

## License

This project is open-source and available for educational use. Feel free to modify and adapt for your institution's needs.

---

**GPS Harkay DMC Management System** - Modern, efficient, and professional student record management.
