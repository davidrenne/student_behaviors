
/**
* InitStudentBehaviorApplication()
*
*/
function InitStudentBehaviorApplication()
{
	try
	{
		if (!window.openDatabase)
		{
			PopupMessageToStudent('Databases are not supported in this browser.  Please try Chrome, Safari, Opera, Android or Blackberry.   Or whatever this says. http://caniuse.com/#search=sql-storage');
		}
		else
		{
			var shortName = 'BehaviorDB';
			var version = '1.0';
			var displayName = 'Behavior Database';
			var maxSize = 4 * 1024 * 1024; //  bytes
			BehaviorDB = openDatabase(shortName, version, displayName, maxSize);
			InitTables();
		}
	}
	catch(e)
	{
		if (e == 2)
		{
			PopupMessageToStudent("Invalid database version.");
		}
		else
		{
			PopupMessageToStudent("Unknown error "+e+".");
		}
		return;
	}
}

/**
* PopupMessageToStudent()
*
*/
function PopupMessageToStudent(message)
{
	alert(message);
}

/**
* InitButtons()
*
*/
function InitButtons(message)
{
	$( "input[type=button], button" )
		.button()
		.click(
			function( event )
			{
				event.preventDefault();
			}
		);
}

/**
* InitTables()
*
*/
function InitTables()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql('CREATE TABLE IF NOT EXISTS Student(studentId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);', [], StudentTableCreate, ErrorHandler);
		}
	);
}

/**
* StudentTableCreate()
*
*/
function StudentTableCreate(transaction, results)
{
	transaction.executeSql('CREATE TABLE IF NOT EXISTS BehaviorCategory(behaviorCategoryId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, descr TEXT NOT NULL);', [], BehaviorCategoryTableCreate, ErrorHandler);
}

/**
* BehaviorCategoryTableCreate()
*
*/
function BehaviorCategoryTableCreate(transaction, results)
{
	transaction.executeSql('CREATE TABLE IF NOT EXISTS Behavior(behaviorId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, behaviorComment TEXT NOT NULL,studentId INTEGER, behaviorCategoryId INTEGER, UpdateTime TIMESTAMP NOT NULL,FOREIGN KEY(studentId) REFERENCES Student(studentId) ON DELETE CASCADE ON UPDATE CASCADE,FOREIGN KEY(behaviorCategoryId) REFERENCES BehaviorCategory(behaviorCategoryId) ON DELETE CASCADE ON UPDATE CASCADE);', [], LoadDataAndInsertSample, ErrorHandler);
}

/**
* LoadDataAndInsertSample()
*
*/
function LoadDataAndInsertSample(transaction, results)
{
	LoadSampleTestData(transaction, results);
	LoadAllData(transaction, results);
}

/**
* LoadAllData()
*
*/
function LoadAllData(transaction, results)
{
	LoadStudents();
	LoadCategories();
	LoadBehaviors();
}

/**
* LoadSampleTestData()
*
*/
function LoadSampleTestData()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("SELECT 1 FROM Student LIMIT 1;", [], LoadSampleTestDataCallBack, ErrorHandler);
		}
	);
}

/**
* LoadSampleTestDataCallBack()
*
* Optional Starter Data when page is initialized
*/
function LoadSampleTestDataCallBack(transaction, results)
{
	if (results.rows.length == 0)
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				//
				var student1   = ['David Renne'];
				var student2   = ['Kristin Simmons'];
				var student3   = ['Tyler Vann-Campbell'];

				var behavior1  = ['Did not provide good code samples'];
				var behavior2  = ['Doesnt have enough experience'];
				var behavior3  = ['Would not fit in at amazon.com'];

				transaction.executeSql("INSERT INTO Student(name) VALUES (?)", [student1[0]], LoadAllData, ErrorHandler);
				transaction.executeSql("INSERT INTO Student(name) VALUES (?)", [student2[0]], LoadAllData, ErrorHandler);
				transaction.executeSql("INSERT INTO Student(name) VALUES (?)", [student3[0]], LoadAllData, ErrorHandler);

				transaction.executeSql("INSERT INTO BehaviorCategory(descr) VALUES (?)", [behavior1[0]], LoadAllData, ErrorHandler);
				transaction.executeSql("INSERT INTO BehaviorCategory(descr) VALUES (?)", [behavior2[0]], LoadAllData, ErrorHandler);
				transaction.executeSql("INSERT INTO BehaviorCategory(descr) VALUES (?)", [behavior3[0]], LoadAllData, ErrorHandler);
			}
		);
	}
}

/**
* LoadStudents()
*
*/
function LoadStudents()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("SELECT * FROM Student ORDER BY name;", [], StudentResultCallBack, ErrorHandler);
		}
	);
}

/**
* StudentResultCallBack()
*
*/
function StudentResultCallBack(transaction, results)
{
	var len = results.rows.length;
	var ulStudents = $("#ulStudents");
	ulStudents.empty();
	for (var i = 0; i < len; ++i)
	{
		var row = results.rows.item(i);
		ulStudents.append("<li class='row'><div style=\"display: inline;\"><table><tr><td style=\"width:250px\">" + row.name + "</td><td><input type=\"button\" onclick=\"RemoveStudent(" + row.studentId + ",'" + row.name + "');\" value=\"Remove\" /></td></tr></table></div></li>");
	}
	InitButtons();
}

/**
* LoadCategories()
*
*/
function LoadCategories()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("SELECT * FROM BehaviorCategory ORDER BY descr;", [], CategoryDataCallBack, ErrorHandler);
		}
	);
}

/**
* CategoryDataCallBack()
*
*/
function CategoryDataCallBack(transaction, results)
{
	var len = results.rows.length;
	var ulCategories = $("#ulBehaviorCategories");
	ulCategories.empty();
	for (var i = 0; i < len; ++i)
	{
		var row = results.rows.item(i);
		ulCategories.append("<li class='row'><div style=\"display: inline;\"><table><tr><td style=\"width:250px\">" + row.descr + "</td><td><input type=\"button\" onclick=\"PromptForCategoryRemoval(" + row.behaviorCategoryId + ",'" + row.descr + "');\" value=\"Remove\" /></td></tr></table></div></li>");
	}
	InitButtons();
}

/**
* AddNewCategory()
*
*/
function AddNewCategory()
{
	var name = $("#txtBehaviorCategory").val();
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("INSERT INTO BehaviorCategory(descr) VALUES (?)", [name]);
			LoadCategories();
			LoadBehaviors();
			$("#txtBehaviorCategory").val("");
		}
	);
}

/**
* PromptForCategoryRemoval()
*
*/
function PromptForCategoryRemoval(behaviorCateogoryId, descr)
{
	if (confirm("Are you sure you want to remove category: '" + descr + "'?"))
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				transaction.executeSql("DELETE FROM BehaviorCategory WHERE behaviorCategoryId == " + behaviorCateogoryId + ";", [], RemoveCategory, ErrorHandler);
			}
		);
	}
}

/**
* RemoveCategory()
*
*/
function RemoveCategory(transaction, results)
{
	if (results.rowsAffected == 1)
	{
		LoadCategories();
		LoadBehaviors();
	}
}

/**
* LoadBehaviors()
*
*/
function LoadBehaviors()
{
	Categories.length = 0;
	CategoriesDescr.length = 0;
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("SELECT * FROM BehaviorCategory order by descr;", [], BehaviorResultCallBack, ErrorHandler);
		}
	);
}

/**
* BehaviorResultCallBack()
*
*/
function BehaviorResultCallBack(transaction, results)
{
	var len = results.rows.length;
	var divBehaviors = $("#divBehaviors");
	divBehaviors.empty();
	var tableValue = "";
	tableValue += "<table id=\"tblBehaviors\"><tr><td class=\"box-main\">Student</td>";
	for (var i = 0; i < len; ++i)
	{
		tableValue += "<td class=\"box-main\">";
		var row = results.rows.item(i);
		Categories[i] = row.behaviorCategoryId;
		CategoriesDescr[i] = row.descr;
		tableValue += row.descr;
		tableValue += "</td>";
	}
	tableValue += "</tr><tr></tr></table>";
	divBehaviors.append(tableValue);
	/*
	 * Chain the students to create the grid
	 */
	LoadBehaviorStudents();
}

/**
* LoadBehaviorStudents()
*
*/
function LoadBehaviorStudents()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("SELECT * FROM Student order by name;", [], BehaviorStudentResultCallBack, ErrorHandler);
		}
	);
}

/**
* BehaviorStudentResultCallBack()
*
*/
function BehaviorStudentResultCallBack(transaction, results)
{
	var len = results.rows.length;
	var tblBehaviors = $("#tblBehaviors  tr:last");

	for (var i = 0; i < len; ++i)
	{
		var trValue = "";
		trValue += "<tr><td class=\"box-main\">";
		var row = results.rows.item(i);
		trValue += row.name;
		trValue += "</td>";
		for (var cat in Categories)
		{
			 trValue += "<td class=\"box-main\">";
			 trValue += "<img onclick=\"AddNewBehavior(" + row.studentId + "," + Categories[cat] + ")\" class=\"button-hand\" src=\"images/Add.png\"/>&nbsp;&nbsp;<img class=\"button-hand\" onclick=\"AddNewBehaviorWithComment(" + row.studentId + "," + Categories[cat] + ")\" src=\"images/quote.png\"/>&nbsp;&nbsp;<div id=\"" + row.studentId + "-" + Categories[cat] + "\" class=\"behaviorValues\" style=\"display: inline;\"></div>";
			 trValue += "</td>";
		}
		trValue += "</tr>";
		tblBehaviors.after(trValue);
		LoadAllBehaviorValues();
	}
}

/**
* LoadAllBehaviorValues()
*
*/
function LoadAllBehaviorValues()
{
	$(".behaviorValues").html("");
	BehaviorDB.transaction(
		function (transaction)
		{
			var curDate = BehaviorDate.getFullYear() + "-" + ('0' + (BehaviorDate.getMonth() + 1)).slice(-2) + "-" + ('0' + BehaviorDate.getDate()).slice(-2);
			transaction.executeSql("SELECT studentId, behaviorCategoryId, COUNT(*) AS behaviorCount FROM Behavior WHERE date(UpdateTime) = '" + curDate + "' GROUP BY studentId, behaviorCategoryId;", [], LoadAllBehaviorsHandler, ErrorHandler);
		}
	);
}

/**
* LoadAllBehaviorsHandler()
*
*/
function LoadAllBehaviorsHandler(transaction, results)
{
	var len = results.rows.length;
	for (var i = 0; i < len; ++i)
	{
		var row = results.rows.item(i);
		var divToUpdate = $("#" + row.studentId + "-" + row.behaviorCategoryId);
		divToUpdate.html(row.behaviorCount);
	}
}

/**
* AddNewBehaviorWithComment()
*
*/
function AddNewBehaviorWithComment(studentId, behaviorCategoryId)
{
	AddNewBehavior(studentId, behaviorCategoryId,true);
}

/**
* AddNewBehavior()
*
*/
function AddNewBehavior(studentId, behaviorCategoryId, commentMode)
{
	var comment = '';

	if (commentMode)
	{
		comment = window.prompt("Enter a description of the incident","");
		if (!comment)
		{
			comment = '';
		}
	}

	BehaviorDB.transaction(
		function (transaction)
		{
			var d = new Date();
			var curDate = BehaviorDate.getFullYear() + "-" + ('0' + (BehaviorDate.getMonth() + 1)).slice(-2) + "-" + ('0' + BehaviorDate.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2);
			transaction.executeSql("INSERT INTO Behavior(studentId, behaviorCategoryId, UpdateTime, behaviorComment) VALUES (?,?,?,?)", [studentId, behaviorCategoryId, curDate, comment]);
			LoadStudentBehavior(studentId);
			LoadUndo();
		}
	);
}

/**
* LoadUndo()
*
*/
function LoadUndo()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			 transaction.executeSql("SELECT max(behaviorId) as maxBehaviorId FROM Behavior;", [], LoadUndoHandler, ErrorHandler);
		}
	);
}

/**
* LoadUndoHandler()
*
*/
function LoadUndoHandler(transaction, results)
{
	var len = results.rows.length;
	for (var i = 0; i < len; ++i)
	{
		var row = results.rows.item(i);
		UndoBehaviors.push(row.maxBehaviorId);
	}
}

/**
* UndoBehavior()
*
*/
function UndoBehavior()
{
	if (UndoBehaviors.length == 0)
	{
		return false;
	}

	var behaviorId = UndoBehaviors.pop();
	if (confirm("Are you sure you want to undo the last behavior?"))
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				transaction.executeSql("DELETE FROM Behavior WHERE behaviorId = " + behaviorId + ";", [], RemoveBehaviorByDateCallBack, ErrorHandler);
			}
		);
	}
}

/**
* ClearCategories()
*
*/
function ClearCategories()
{
	if (confirm("Are you sure you want to clear all the categories?"))
	{
		BehaviorDB.transaction(
			 function (transaction)
			 {
				 transaction.executeSql("DELETE FROM BehaviorCategory;", [], ClearCategoriesCallBack, ErrorHandler);
			 }
		);
	}
}

/**
* ClearCategoriesCallBack()
*
*/
function ClearCategoriesCallBack(transaction, results)
{
	LoadCategories();
	LoadBehaviors();
}

/**
* ClearBehaviorByDate()
*
*/
function ClearBehaviorByDate()
{
	var curDate = BehaviorDate.getFullYear() + "-" + ('0' + (BehaviorDate.getMonth() + 1)).slice(-2) + "-" + ('0' + BehaviorDate.getDate()).slice(-2);
	if (confirm("Are you sure you want to clear all the behavior data for: " + curDate + "?"))
	{
		BehaviorDB.transaction(
			 function (transaction)
			 {
				 transaction.executeSql("DELETE FROM Behavior WHERE date(UpdateTime) = '" + curDate + "';", [], RemoveBehaviorByDateCallBack, ErrorHandler);
			 }
		);
	}
}

/**
* RemoveBehaviorByDateCallBack()
*
*/
function RemoveBehaviorByDateCallBack(transaction, results)
{
	LoadAllBehaviorValues();
}

/**
* LoadStudentBehavior()
*
*/
function LoadStudentBehavior(studentId)
{
	BehaviorDB.transaction(
		function (transaction)
		{
			var curDate = BehaviorDate.getFullYear() + "-" + ('0' + (BehaviorDate.getMonth() + 1)).slice(-2) + "-" + ('0' + BehaviorDate.getDate()).slice(-2);
			transaction.executeSql("SELECT studentId, behaviorCategoryId, COUNT(*) AS behaviorCount FROM Behavior WHERE studentId = " + studentId + " and date(UpdateTime) = '" + curDate + "' GROUP BY studentId, behaviorCategoryId;", [], LoadAllBehaviorsHandler, ErrorHandler);
		}
	);
}

/**
* ErrorHandler()
*
*/
function ErrorHandler(transaction, results)
{
	PopupMessageToStudent(results.message);
}

/**
* AddNewStudent()
*
*/
function AddNewStudent()
{
	var name = $("#txtStudentName").val();
	BehaviorDB.transaction(
		function (transaction)
		{
			transaction.executeSql("INSERT INTO Student(name) VALUES (?)", [name]);
			LoadStudents();
			LoadBehaviors();
			$("#txtStudentName").val("");
		}
	);
}

/**
* RemoveStudent()
*
*/
function RemoveStudent(studentId, name)
{
	if (confirm("Are you sure you want to remove student: '" + name + "'?"))
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				transaction.executeSql("DELETE FROM Student WHERE studentId == " + studentId + ";", [], HandleRemoveStudent, ErrorHandler);
			}
		);
	}
}

/**
* HandleRemoveStudent()
*
*/
function HandleRemoveStudent(transaction, results)
{
	LoadStudents();
	LoadBehaviors();
}

/**
* TruncateData()
*
*/
function TruncateData()
{
	if (confirm("Are you sure you want to clear all data?"))
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				transaction.executeSql('DELETE FROM Student');
				LoadStudents();
				LoadBehaviors();
			}
		);
	}
}

/**
* DropTables()
*
*/
function DropTables()
{
	if (confirm("Are you sure you want to drop all tables?"))
	{
		BehaviorDB.transaction(
			function (transaction)
			{
				transaction.executeSql('DROP TABLE Behavior');
				transaction.executeSql('DROP TABLE Student');
			}
		);
	}
}

/**
* GoToNextDate()
*
*/
function GoToNextDate()
{
	BehaviorDate.setDate(BehaviorDate.getDate() + 1);
	$("#BehaviorDate").html(BehaviorDate.toDateString());
	LoadAllBehaviorValues();
	UndoBehaviors.length = 0;
}

/**
* GoToPrevDate()
*
*/
function GoToPrevDate()
{
	BehaviorDate.setDate(BehaviorDate.getDate() - 1);
	$("#BehaviorDate").html(BehaviorDate.toDateString());
	LoadAllBehaviorValues();
	UndoBehaviors.length = 0;
}

/**
* OutputPDFReportBehaviors()
*
*/
function OutputPDFReportBehaviors()
{
	BehaviorDB.transaction(
		function (transaction)
		{
			var curDate = BehaviorDate.getFullYear() + "-" + ('0' + (BehaviorDate.getMonth() + 1)).slice(-2) + "-" + ('0' + BehaviorDate.getDate()).slice(-2);
			transaction.executeSql("SELECT s.name, b.behaviorComment, bc.descr, bc.behaviorCategoryId, b.UpdateTime, c.catCount FROM Behavior AS b INNER JOIN (SELECT sub.studentId, sub.behaviorCategoryId, COUNT(*) as catCount FROM Behavior sub WHERE date(sub.UpdateTime) = '" + curDate + "' GROUP BY sub.studentId, sub.behaviorCategoryId) AS c ON c.studentId = b.studentId AND c.behaviorCategoryId = b.behaviorCategoryId INNER JOIN BehaviorCategory AS bc ON bc.behaviorCategoryId = b.behaviorCategoryId INNER JOIN Student AS s ON s.studentId = b.studentId  WHERE date(b.UpdateTime) = '" + curDate + "' ORDER BY s.name, bc.behaviorCategoryId;", [], OutputPDFReportBehaviorsCallback, ErrorHandler);
		}
	);
}

/**
* OutputPDFReportBehaviorsCallback()
*
*/
function OutputPDFReportBehaviorsCallback(transaction, results)
{
	var len = results.rows.length;
	var doc = new jsPDF();
	var currentStudent = "";
	var currentBehaviorCat = "";
	var j = 2;

	for (var i = 0; i < len; ++i)
	{
		var row = results.rows.item(i);
		if (currentStudent != row.name)
		{
			j = 3;
			if (i > 0)
			{
				doc.addPage();
			}
			doc.text(50, 10, "Student Behavior Report (" + BehaviorDate.toDateString() + ")");
			doc.text(0, 20, "Student:  " + row.name);
			doc.text(0, j * 10, "Behaviors:");
			currentBehaviorCat = "";
			currentStudent = row.name;
			j++;
		}

		if (currentBehaviorCat != row.descr)
		{
			currentBehaviorCat = row.descr;
			doc.text(20, j * 10, row.descr + ":   " + row.catCount);
			j++;
		}

		var time = row.UpdateTime.substring(row.UpdateTime.length - 5, row.UpdateTime.length);
		var timeArray = time.split(":");
		var timeString = GetHour(timeArray[0]) + ":" + timeArray[1] + " " + GetPM(timeArray[0]);

		if (row.behaviorComment)
		{
			timeString += " (" + row.behaviorComment + ")"
		}

		doc.text(30, j * 10, timeString);
		j++;
	}

	doc.output('datauri');
}

/**
* GetHour()
*
*/
function GetHour(h)
{
	if (h == "13" || h == "14" || h == "15" || h == "16" || h == "17" || h == "18" || h == "19" || h == "20" || h == "21" || h == "22" || h == "23")
	{
		return parseInt(h) - 12;
	}

	if (h == "00")
	{
		return 12;
	}
	return parseInt(h, 10);
}

/**
* GetPM()
*
*/
function GetPM(h)
{
	if (h == "12" || h == "13" || h == "14" || h == "15" || h == "16" || h == "17" || h == "18" || h == "19" || h == "20" || h == "21" || h == "22" || h == "23")
	{
		return "PM";
	}
	else
	{
		return "AM";
	}
}