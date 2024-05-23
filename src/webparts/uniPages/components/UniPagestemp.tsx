import * as React from 'react';
import type { IUniPagesProps } from './IUniPagesProps';
import { getSP } from "./Spfx_sp.config";
import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";

export default class UniPages extends React.Component<IUniPagesProps, { shortlistedUniversities: any[] }> {
private _sp: SPFI;

constructor(props: IUniPagesProps) {
super(props);
this.state = { shortlistedUniversities: [] };
this._sp = getSP();
}

componentDidMount() {
this.getUniInfo();
this.getShortlistedUniversities();
}

private getUniInfo = async () => {
//  const pageTitle = document.title;
const pageTitle = "Harvard University";
//  if (!pageTitle.trim()) {
//    // console.error("Page title is blank.");
//    // alert("Page title is blank. Please set a title for the page.");
//    return;
//  }
try {
const uni: any[] = await this._sp.web.lists
.getByTitle("University")
.items.filter(`Title eq '${pageTitle}'`)
.select(
"ID",
"Title",
"City",
"Expense",
"GlobalRank",
"TotalEnrollment",
"Undergraduates",
"FinancialAid",
"PellGrant",
"StudentLoans",
"AverageDebt",
"Applicants",
"Accepted",
"Enrolled",
"ReturningFreshmen",
"Academics",
"Social",
"QualityOfLife",
"Admission",
"ApplicationForm"
)();

if (uni.length > 0) {
let html = `
<div style="margin-bottom: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
<h2>${uni[0].Title}</h2>
<table style="width: 100%; border-collapse: collapse;">
`;
const displayElements = [
"City",
"Expense",
"GlobalRank",
"TotalEnrollment",
"Undergraduates",
"FinancialAid",
"PellGrant",
"StudentLoans",
"AverageDebt",
"Applicants",
"Accepted",
"Enrolled",
"ReturningFreshmen",
"Academics",
"Social",
"QualityOfLife",
"Admission"
];
displayElements.forEach(element => {
if (uni[0].hasOwnProperty(element)) {
let value = uni[0][element];
if (value === undefined || value === null) {
value = "NA";
}
html += `<tr style="border-bottom: 1px solid #ddd;">
<td style="padding: 8px; text-align: left;"><strong>${element}</strong></td>
<td style="padding: 8px; text-align: left;">${value}</td>
</tr>`;
}
});
html += `</table>`;

const allItemsElement = document.getElementById("allItems");

if (allItemsElement) {
allItemsElement.innerHTML = html;

// Add a button for ApplicationForm
const applicationFormLink = uni[0]["ApplicationForm"];
if (applicationFormLink) {
const hasShortlisted = await this.hasShortlistedUniversity(uni[0].Title);
if (hasShortlisted) {
const buttonHtml = `<button onclick="window.open('${applicationFormLink}', '_blank')" style="margin-top: 10px; padding: 8px 16px; background-color: #007bff; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Application Form</button>`;
allItemsElement.innerHTML += buttonHtml;
}
} else {
console.error("ApplicationForm link not found.");
}

if (!allItemsElement.querySelector(".shortlistButton")) {
const addButton = document.createElement("button");
addButton.textContent = "Add to Shortlisted";
addButton.className = "shortlistButton";
addButton.style.marginTop = "10px";
addButton.style.padding = "8px 16px";
addButton.style.backgroundColor = "#28a745";
addButton.style.color = "#fff";
addButton.style.border = "none";
addButton.style.borderRadius = "5px";
addButton.style.cursor = "pointer";
addButton.addEventListener("click", () => this.addToShortlisted(uni[0].Title, uni[0]));
allItemsElement.appendChild(addButton);
}

} else {
console.error("Element with id 'allItems' not found.");
}
} else {
alert(`No data found for the selected university.`);
}
} catch (error) {
console.error("An error occurred while fetching the item:", error);
alert("An error occurred while fetching the items.");
}
};


private getShortlistedUniversities = async () => {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;
const shortlistedUniversities: any[] = await this._sp.web.lists.getByTitle("Shortlisted").items
.select("ID", "Title", "University", "username")
.filter(`username eq '${loginName}'`)
();

this.setState({ shortlistedUniversities });
} catch (error) {
console.error("An error occurred while fetching the shortlisted universities:", error);
}
};

//@ts-ignore
private async getApplicationDateForUniversity(title: string): Promise<string | null> {
try {
const uni: any[] = await this._sp.web.lists
.getByTitle("University")
.items.filter(`Title eq '${title}'`)
.select("ApplicationDates")();

if (uni.length > 0) {
return uni[0]["ApplicationDates"] || null;
}
return null;
} catch (error) {
console.error("An error occurred while fetching the application date:", error);
return null;
}
}

private addToShortlisted = async (title: string, uni: any) => {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;
const date = this.getCurrentDate();
const MyItemUniq = `${loginName}${date}${title}`;
const email = user.Email;

// Check if the university is already shortlisted
const isShortlisted = await this.checkIfShortlisted(loginName, title);
if (isShortlisted) {
alert(`University ${title} is already shortlisted.`);
return;
}

// Fetch the ApplicationDate for the university
const applicationDate = await this.getApplicationDateForUniversity(title);

await this._sp.web.lists.getByTitle("Shortlisted").items.add({
Title: `Shortlisted ${title}`,
University: title,
UniqueIdentifier: MyItemUniq,
username: loginName,
ShortlistDate: date,
ApplicationDate: applicationDate, // Add ApplicationDate to the Shortlisted list
EmailID : email,
});

alert(`University ${title} added to Shortlisted successfully.`);
this.getUniInfo();
this.getShortlistedUniversities();
} catch (error) {
console.error("An error occurred while adding the university to Shortlisted:", error);
alert("An error occurred while adding the university to Shortlisted.");
}
};



private async hasShortlistedUniversity(title: string): Promise<boolean> {
try {
const user = await this._sp.web.currentUser();
const loginName = user.Title;

const result = await this._sp.web.lists.getByTitle("Shortlisted").items
.filter(`University eq '${title}' and username eq '${loginName}'`)
();

return result.length > 0;
} catch (error) {
console.error("Error checking if the university is shortlisted:", error);
return false;
}
}

private checkIfShortlisted = async (username: string, university: string): Promise<boolean> => {
const result = await this._sp.web.lists.getByTitle("Shortlisted")
.items.filter(`username eq '${username}' and University eq '${university}'`)
.select("ID")
();

return result.length > 0;
};

private getCurrentDate = () => {
const date = new Date();
return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

private deleteFromShortlisted = async (id: number) => {
try {
await this._sp.web.lists.getByTitle("Shortlisted").items.getById(id).delete();
alert("University removed from Shortlisted successfully.");
this.getUniInfo();
this.getShortlistedUniversities(); // Refresh the shortlisted universities list
} catch (error) {
console.error("An error occurred while deleting the university from Shortlisted:", error);
alert("An error occurred while deleting the university from Shortlisted.");
}
};

public renderShortlistedUniversities = () => {
return (
<div>
<h2>Shortlisted Universities</h2>
{this.state.shortlistedUniversities.map((uni) => (
<div key={uni.ID} style={{ marginBottom: '10px' }}>
<p>{uni.Title}</p>
<button
style={{
padding: '5px 10px',
backgroundColor: '#f44336',
color: 'white',
border: 'none',
borderRadius: '5px',
cursor: 'pointer',
}}
onClick={() => this.deleteFromShortlisted(uni.ID)}
>
Delete
</button>
</div>
))}
</div>
);
};


public render(): React.ReactElement<IUniPagesProps> {
return (
<div>
<h1>{document.title}</h1> {/* Display the page title */}
<div id="allItems"></div> {/* Display university information here */}
{this.renderShortlistedUniversities()}
</div>
);
}
}

// public renderShortlistedUniversities = () => {
//   return (
//     <div>
//       <h2>Shortlisted Universities</h2>
//       {this.state.shortlistedUniversities.map((uni) => (
//         <div key={uni.ID}>
//           <p>{uni.Title}</p>
//           <button onClick={() => this.deleteFromShortlisted(uni.ID)}>Delete</button>
//         </div>
//       ))}
//     </div>
//   );
// };

// working code
//  private getUniInfo = async () => {
//   const pageTitle = "Harvard University"; // For testing; replace with actual title fetching logic
//   try {
//     const uni: any[] = await this._sp.web.lists
//       .getByTitle("University")
//       .items.filter(`Title eq '${pageTitle}'`)
//       .select(
//         "ID",
//         "Title",
//         "City",
//         "Expense",
//         "GlobalRank",
//         "TotalEnrollment",
//         "Undergraduates",
//         "FinancialAid",
//         "PellGrant",
//         "StudentLoans",
//         "AverageDebt",
//         "Applicants",
//         "Accepted",
//         "Enrolled",
//         "ReturningFreshmen",
//         "Academics",
//         "Social",
//         "QualityOfLife",
//         "Admission",
//         "ApplicationForm"
//       )();

//     if (uni.length > 0) {
//       let html = `<table>`;
//       const displayElements = [
//         "Title",
//         "City",
//         "Expense",
//         "GlobalRank",
//         "TotalEnrollment",
//         "Undergraduates",
//         "FinancialAid",
//         "PellGrant",
//         "StudentLoans",
//         "AverageDebt",
//         "Applicants",
//         "Accepted",
//         "Enrolled",
//         "ReturningFreshmen",
//         "Academics",
//         "Social",
//         "QualityOfLife",
//         "Admission"
//       ];
//       displayElements.forEach(element => {
//         if (uni[0].hasOwnProperty(element)) {
//           let value = uni[0][element];
//           if (value === undefined || value === null) {
//             value = "NA";
//           }
//           html += `<tr><td><strong>${element}</strong></td><td>${value}</td></tr>`;
//         }
//       });
//       html += `</table>`;

//       const allItemsElement = document.getElementById("allItems");

//       if (allItemsElement) {
//         allItemsElement.innerHTML = html;

//         // Add a button for ApplicationForm
//         const applicationFormLink = uni[0]["ApplicationForm"];
//         if (applicationFormLink) {
//           const hasShortlisted = await this.hasShortlistedUniversity(uni[0].Title);
//           if (hasShortlisted) {
//             const buttonHtml = `<button onclick="window.open('${applicationFormLink}', '_blank')">Application Form</button>`;
//             allItemsElement.innerHTML += buttonHtml;
//           }
//         } else {
//           console.error("ApplicationForm link not found.");
//         }

//         if (!allItemsElement.querySelector(".shortlistButton")) {
//           const addButton = document.createElement("button");
//           addButton.textContent = "Add to Shortlisted";
//           addButton.className = "shortlistButton"; // Add a class to identify the button
//           addButton.addEventListener("click", () => this.addToShortlisted(uni[0].Title, uni[0]));
//           allItemsElement.appendChild(addButton);
//         }
//       } else {
//         console.error("Element with id 'allItems' not found.");
//       }
//     } else {
//       alert(`No data found for the selected university.`);
//     }
//   } catch (error) {
//     console.error("An error occurred while fetching the item:", error);
//     alert("An error occurred while fetching the items.");
//   }
// };

// new 

// working shortlisting
// private addToShortlisted = async (title: string, uni: any) => {
//     try {
//       const user = await this._sp.web.currentUser();
//       const loginName = user.Title;
//       const date = this.getCurrentDate();
//       const MyItemUniq = `${loginName}${date}${title}`;


//      // Check if the university is already shortlisted
//      const isShortlisted = await this.checkIfShortlisted(loginName, title);
//      if (isShortlisted) {
//        alert(`University ${title} is already shortlisted.`);
//        return;
//      }

//       await this._sp.web.lists.getByTitle("Shortlisted").items.add({
//         Title: `Shortlisted ${title}`,
//         University: title,
//         UniqueIdentifier: MyItemUniq  ,
//         username: loginName,
//         ShortlistDate: date,

//       });

//       alert(`University ${title} added to Shortlisted successfully.`);
//       this.getUniInfo();

//       this.getShortlistedUniversities();
//     } catch (error) {
//       console.error("An error occurred while adding the university to Shortlisted:", error);
//       alert("An error occurred while adding the university to Shortlisted.");
//     }
// };

// Application Date update in shortlisting

