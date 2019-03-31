var monthArray = ["JAN", "FEB", "March", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];

function makePDF() {
	var quotes = document.getElementById('container-fluid');

	html2canvas(quotes, {
		onrendered: function(canvas) {

			//! MAKE YOUR PDF
			var pdf = new jsPDF('p', 'pt');

			for (var i = 0; i <= quotes.clientHeight / 1010; i++) {
				//! This is all just html2canvas stuff
				var srcImg = canvas;
				var sX = 0;
				var sY = 1010 * i; // start 1010 pixels down for every new page
				var sWidth = 1024;
				var sHeight = 1010;
				var dX = 0;
				var dY = 0;
				var dWidth = 900;
				var dHeight = 1010;

				window.onePageCanvas = document.createElement("canvas");
				onePageCanvas.setAttribute('width', 1024);
				onePageCanvas.setAttribute('height', 1010);
				var ctx = onePageCanvas.getContext('2d');
				// details on this usage of this function: 
				// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#Slicing
				ctx.drawImage(srcImg, sX, sY, sWidth, sHeight, dX, dY, dWidth, dHeight);

				// document.body.appendChild(canvas);
				var canvasDataURL = onePageCanvas.toDataURL("image/png", 1.0);

				var width = onePageCanvas.width;
				var height = onePageCanvas.clientHeight;

				//! If we're on anything other than the first page,
				// add another page
				if (i > 0) {
					pdf.addPage(612, 791); //8.5" x 11" in pts (in*72)
				}
				//! now we declare that we're working on that page
				pdf.setPage(i + 1);
				//! now we add content to that page!
				pdf.addImage(canvasDataURL, 'PNG', 20, 40, (width * .62), (height * .62));

			}
			//! after the for loop is finished running, we save the pdf.
			pdf.save('test.pdf');
		}
	});
}

var testData = [
	{
	  "empId" : "0242",
	  "empName" : "Sundar Sivaraman",
	  "from" : "2017-01-12",
	  "to" : "2017-01-14",
	  "totaldays" : "2",
	  "planned" : "y",
	  "remarks" : "Pongal Holidays"
	},
	{
	  "empId" : "0243",
	  "empName" : "Neha Mhatre",
	  "from" : "2017-02-12",
	  "to" : "2017-02-24",
	  "totaldays" : "2",
	  "planned" : "y",
	  "remarks" : "Pongal Holidays2"
	},
	{
	  "empId" : "05",
	  "empName" : "Topher",
	  "from" : "2017-02-25",
	  "to" : "2017-02-28",
	  "totaldays" : "2",
	  "planned" : "y",
	  "remarks" : "Trip to Kerela"
	}

];

/*All date related functionality ---- start*/

var lowestDate = testData.map(function(v,i){ 
	return new Date(v.from);
}).reduce(function(x,y){
	return (+x <= +y)?x:y
});

var calendarEnd = testData.map(function(v,i) {
	return new Date(v.to);
}).reduce(function(x,y){
	return (+x >= +y)?x:y
});

var calendarStart = new Date(lowestDate.getTime());
calendarStart.setDate(1);

function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}


function treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}

function daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / millisecondsPerDay;
}


/*number of smaller grid in grids*/
var numberOfBlocks = Math.ceil(daysBetween(calendarStart, calendarEnd) / 35);

 /* zero based :: 0 is sunday , number of irrelevant days is equal to startDay also */
var startDay = calendarStart.getDay();


function returnGrid(startDate,relevantStart) {
	var i;
	var grid = [];
	var currentDate = startDate;
	for(i=0; i<35; i++){
		grid.push({
			date: currentDate.getDate(),
			month: (currentDate.getMonth() + 1),
			year: (currentDate.getYear() + 1900),
			tasks: [],
			irrelevant: (relevantStart !== 0)

		});
		if(relevantStart > 0) {
			relevantStart = relevantStart - 1;
		}
		currentDate.setDate(currentDate.getDate() + 1)
	}
	return grid;
}


var grids = [],i, current = new Date(calendarStart), grid, lastDay;

for (i=0; i < numberOfBlocks; i++) {
	if(i==0) {
		grid = returnGrid(current,startDay);
	}
	else {
		grid = returnGrid(current,0);
	}
	grids.push(grid);
	lastDay = grid[34];
	lastDay = new Date(lastDay.year, lastDay.month -1, lastDay.date);
	current.setDate(lastDay.getDate() + 1);
}

function getDateString(date) {
	return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
}

/*All date related functionality ---- end*/

/*Handlebar helper to create the grid*/

Handlebars.registerHelper('cardrow', function(item, options) {
	var j,i,rowStart = '<div class="row">';
	var rowEnd = '</div>';
	var markup = '';
	for (i=0; i<5; i++) {
		markup += rowStart;
		for (j= i*7; j < ((i*7) + 7); j++) {
			markup += '<div class="card" data-id="'+item[j].year+'-'+item[j].month+'-'+item[j].date+'"><span class="date">'+((!item[j].irrelevant)?(item[j].date)+' '+monthArray[(item[j].month-1)]+' '+item[j].year:'')+'</span></div>'
		}
		markup += rowEnd;
	}
	return markup;
});

var templateString = '{{#each this}}<div class="month"><div class="row bottom-separate"><div class="header-card">Sunday</div><div class="header-card">Monday</div><div class="header-card">Tuesday</div><div class="header-card">Wednesday</div><div class="header-card">Thursday</div><div class="header-card">Friday</div><div class="header-card">Saturday</div></div>{{#cardrow this}}{{/cardrow}}</div>{{/each}}';
var template = Handlebars.compile(templateString);

var markup = template(grids);

$('#container-fluid').html(markup);

//find the location of the second space in a string - if there are no more than 1 space in the string - return -1
function findSecondSpace(str){
  var index1 = str.indexOf(' ');
  if(index1 == -1)
  	return str.length;
  var index2 = str.indexOf(' ', index1+1);
  return (index2 !== -1)?index2:str.length;
}

function addEvent(start,end,label) {
	var notReached = true, str;
	var startCopy = new Date(start.getTime());
	var endCopy = new Date(end.getTime());
	var cacheSelect, div;
	var eachTimeText, index;
	var bkg = randomColor({
	   luminosity: 'bright'
	});
	var div;
	
	do{
		str = getDateString(startCopy);
		cacheSelect = $("[data-id="+str+"]");
		if(label.length > 0) {
			index = findSecondSpace(label);
			index = (index <= 19)?index:19;
			eachTimeText = label.substring(0,index);
			label = label.substring(index+1);
		}
		else {
			eachTimeText = '';
		}
		div = $('<div class="inner" style="background-color:'+bkg+'">'+eachTimeText+'</div>')
		cacheSelect.append(div);
		notReached = !(+startCopy == +endCopy);
		startCopy.setDate(startCopy.getDate() + 1);
	}while(notReached);
}


testData.forEach(function(v,i){
	addEvent(new Date(v.from),new Date(v.to),v.empName+' '+v.remarks);
});


$(document).ready(function() {
	window.setTimeout(function() {
		$('.generate').addClass('active');
		$('.generate').on('click', function() {
			console.log('generating pdf');
			makePDF();
		})
	}, 100);
})


