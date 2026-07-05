Attribute VB_Name = "LineListingSplitter"
Option Explicit

' Portfolio-safe, generic recreation using synthetic field names.
' The macro does not contain employer data, client mappings, or proprietary logic.

Public Sub SplitLineListingInteractive()
    Dim sourceRange As Range, idHeader As Range
    Dim patientColumn As Long, modeChoice As String
    Dim uniqueIds As Object, cell As Range, patientId As String
    Dim outputFolder As String, key As Variant
    Dim sourceSheet As Worksheet, headerRow As Long
    Dim rowsForPatient As Range, outputBook As Workbook, outputSheet As Worksheet
    Dim safeName As String, firstSheetUsed As Boolean

    On Error GoTo CleanFail

    On Error Resume Next
    Set sourceRange = Application.InputBox( _
        Prompt:="Select the complete line-listing range, including the header row.", _
        Title:="Select source data", Type:=8)
    On Error GoTo CleanFail
    If sourceRange Is Nothing Then Exit Sub
    If sourceRange.Areas.Count > 1 Then
        MsgBox "Select one continuous source range.", vbExclamation
        Exit Sub
    End If

    On Error Resume Next
    Set idHeader = Application.InputBox( _
        Prompt:="Select the header cell for the patient identifier column.", _
        Title:="Select patient identifier", Type:=8)
    On Error GoTo CleanFail
    If idHeader Is Nothing Then Exit Sub
    If Not idHeader.Worksheet Is sourceRange.Worksheet Then
        MsgBox "The patient identifier must be on the same worksheet as the source range.", vbExclamation
        Exit Sub
    End If

    If Intersect(idHeader, sourceRange.Rows(1)) Is Nothing Then
        MsgBox "The patient identifier must be selected from the first row of the chosen range.", vbExclamation
        Exit Sub
    End If

    Set sourceSheet = sourceRange.Worksheet
    headerRow = sourceRange.Row
    patientColumn = idHeader.Column - sourceRange.Column + 1

    modeChoice = InputBox( _
        "Choose output mode:" & vbCrLf & _
        "1 = Separate workbook for each patient" & vbCrLf & _
        "2 = One workbook with a worksheet for each patient", _
        "Output mode", "1")
    If modeChoice <> "1" And modeChoice <> "2" Then Exit Sub

    Set uniqueIds = CreateObject("Scripting.Dictionary")
    uniqueIds.CompareMode = vbTextCompare

    For Each cell In sourceRange.Columns(patientColumn).Cells
        If cell.Row > headerRow Then
            patientId = Trim$(CStr(cell.Value2))
            If Len(patientId) > 0 Then uniqueIds(patientId) = True
        End If
    Next cell

    If uniqueIds.Count = 0 Then
        MsgBox "No patient identifiers were found in the selected column.", vbExclamation
        Exit Sub
    End If

    Application.ScreenUpdating = False
    Application.DisplayAlerts = False

    If modeChoice = "1" Then
        outputFolder = PickOutputFolder()
        If Len(outputFolder) = 0 Then GoTo CleanExit

        For Each key In uniqueIds.Keys
            Set rowsForPatient = BuildPatientRange(sourceRange, patientColumn, CStr(key))
            If Not rowsForPatient Is Nothing Then
                Set outputBook = Workbooks.Add(xlWBATWorksheet)
                Set outputSheet = outputBook.Worksheets(1)
                outputSheet.Name = "Line Listing"
                rowsForPatient.Copy Destination:=outputSheet.Range("A1")
                outputSheet.Columns.AutoFit
                safeName = SafeFileName(CStr(key))
                outputBook.SaveAs Filename:=UniqueFilePath(outputFolder, safeName), _
                    FileFormat:=xlOpenXMLWorkbook
                outputBook.Close SaveChanges:=False
            End If
        Next key
    Else
        Set outputBook = Workbooks.Add(xlWBATWorksheet)
        firstSheetUsed = False

        For Each key In uniqueIds.Keys
            Set rowsForPatient = BuildPatientRange(sourceRange, patientColumn, CStr(key))
            If Not rowsForPatient Is Nothing Then
                If Not firstSheetUsed Then
                    Set outputSheet = outputBook.Worksheets(1)
                    firstSheetUsed = True
                Else
                    Set outputSheet = outputBook.Worksheets.Add(After:=outputBook.Sheets(outputBook.Sheets.Count))
                End If
                outputSheet.Name = UniqueSheetName(outputBook, SafeSheetName(CStr(key)), outputSheet)
                rowsForPatient.Copy Destination:=outputSheet.Range("A1")
                outputSheet.Columns.AutoFit
            End If
        Next key

        MsgBox uniqueIds.Count & " patient worksheets were created. Save the new workbook when ready.", vbInformation
        outputBook.Activate
    End If

    MsgBox uniqueIds.Count & " patient record group(s) were processed successfully.", vbInformation

CleanExit:
    Application.DisplayAlerts = True
    Application.ScreenUpdating = True
    Exit Sub

CleanFail:
    Application.DisplayAlerts = True
    Application.ScreenUpdating = True
    MsgBox "The split could not be completed: " & Err.Description, vbCritical
End Sub

Private Function BuildPatientRange(ByVal sourceRange As Range, ByVal patientColumn As Long, _
                                   ByVal patientId As String) As Range
    Dim rowIndex As Long, selectedRows As Range
    Set selectedRows = sourceRange.Rows(1)

    For rowIndex = 2 To sourceRange.Rows.Count
        If StrComp(Trim$(CStr(sourceRange.Cells(rowIndex, patientColumn).Value2)), _
                   patientId, vbTextCompare) = 0 Then
            Set selectedRows = Union(selectedRows, sourceRange.Rows(rowIndex))
        End If
    Next rowIndex
    Set BuildPatientRange = selectedRows
End Function

Private Function PickOutputFolder() As String
    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "Choose the folder for split patient files"
        If .Show = -1 Then PickOutputFolder = .SelectedItems(1)
    End With
End Function

Private Function SafeFileName(ByVal value As String) As String
    Dim badChars As Variant, item As Variant
    badChars = Array("\", "/", ":", "*", "?", """", "<", ">", "|")
    value = Trim$(value)
    For Each item In badChars
        value = Replace(value, CStr(item), "_")
    Next item
    If Len(value) = 0 Then value = "Unidentified_Patient"
    SafeFileName = Left$(value, 120)
End Function

Private Function SafeSheetName(ByVal value As String) As String
    Dim badChars As Variant, item As Variant
    badChars = Array("\", "/", ":", "*", "?", "[", "]")
    value = Trim$(value)
    For Each item In badChars
        value = Replace(value, CStr(item), "_")
    Next item
    If Len(value) = 0 Then value = "Patient"
    SafeSheetName = Left$(value, 31)
End Function

Private Function UniqueSheetName(ByVal workbookObject As Workbook, ByVal baseName As String, _
                                 ByVal currentSheet As Worksheet) As String
    Dim candidate As String, suffix As Long
    candidate = baseName
    suffix = 1
    Do While SheetExists(workbookObject, candidate, currentSheet)
        suffix = suffix + 1
        candidate = Left$(baseName, 27) & "_" & suffix
    Loop
    UniqueSheetName = candidate
End Function

Private Function SheetExists(ByVal workbookObject As Workbook, ByVal sheetName As String, _
                             ByVal currentSheet As Worksheet) As Boolean
    Dim ws As Worksheet
    Set ws = Nothing
    On Error Resume Next
    Set ws = workbookObject.Worksheets(sheetName)
    If ws Is Nothing Then
        SheetExists = False
    Else
        SheetExists = Not (ws Is currentSheet)
    End If
    On Error GoTo 0
End Function

Private Function UniqueFilePath(ByVal outputFolder As String, ByVal baseName As String) As String
    Dim candidate As String, suffix As Long
    candidate = outputFolder & Application.PathSeparator & baseName & ".xlsx"
    suffix = 1
    Do While Len(Dir$(candidate)) > 0
        suffix = suffix + 1
        candidate = outputFolder & Application.PathSeparator & baseName & "_" & suffix & ".xlsx"
    Loop
    UniqueFilePath = candidate
End Function
