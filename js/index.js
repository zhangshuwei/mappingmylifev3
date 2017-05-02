
/*********************CONSTANTES******************************
***********************************************************/
    var protocol = "http://",
        geopointDoctype = "fr.orange.geopoint",
        phoneCommunicationDoctype = "fr.orange.phonecommunicationlog",
        pointFavorisDoctype = "fr.orange.pointfavoris",
        dataAPI = "/data/",
        listDocsAPI = "/_all_docs?include_docs=true",
        GEOLOCITEM = "geoloc",
        PHONECALLITEM = "phonecall",
        FAVORIS = "favoris",
        SHOWALL = "showall";

/*********************VARIABLES******************************
***********************************************************/
    var geoItems = [],
        dataItems = [],
        phoneItems = [],
        geoTab = [],
        phoneTab = [],
        geoMarkers = [],
        phoneMarkers = [],
        geoAggregate = [],
        phoneAggregate = [],
        APP,
        favorisPoints,
        favorisId,
        top5Geo,
        top5Phone,
        markers = new L.featureGroup();
    var geoIcon = L.AwesomeMarkers.icon({
        icon: 'street-view',
        markerColor: 'orange',
        prefix: 'fa'
    });
    var phoneIcon = L.AwesomeMarkers.icon({
        icon: 'phone',
        markerColor: 'blue',
        prefix: 'fa'
      });
    var homeIcon = L.AwesomeMarkers.icon({
        icon: 'home',
        markerColor: 'purple',
        prefix: 'fa'
    });
    var worklIcon = L.AwesomeMarkers.icon({
        icon: 'briefcase',
        markerColor: 'darktred',
        prefix: 'fa'
    });
    var shopIcon = L.AwesomeMarkers.icon({
        icon: 'shopping-cart',
        markerColor: 'darkblue',
        prefix: 'fa'
    });
    var sportIcon = L.AwesomeMarkers.icon({
        icon: 'futbol-o',
        markerColor: 'green',
        prefix: 'fa'
    });
    var otherIcon = L.AwesomeMarkers.icon({
        icon: 'star',
        markerColor: 'darkpurple',
        prefix: 'fa'
    });

/*********************Show Map******************************
***********************************************************/
    var streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoia29yZGVsb3IiLCJhIjoiY2l5Ymo4NnloMDA3ZDJ3cWt4OHV0bHFwbyJ9.jFVQwINz__6hzbUEPNP04A', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 19,
        id: 'mapbox.streets'
        });
    var mymap = L.map('mapid',{ layers: [ streets], zoom: 13, center: [48.866667,2.333333]});
/*********************Show TimeLine******************************
***********************************************************/

    var container = document.getElementById('timeline');

    if(container != null){
    var timeLineItems = new vis.DataSet([]);
    var groups = new vis.DataSet([
            {id: 0, content: 'GeoLocation', value: 1, order: 1, className: GEOLOCITEM},
            {id: 1, content: 'PhoneCommunication', value: 2, order: 2, className: PHONECALLITEM}
            ]);
    var timelineOptions = {
        clickToUse: true,
        type: 'point',
        stack: false,
        zoomMax: 1000 * 60 * 60 * 24 * 31 * 12 * 10,
        zoomMin: 1000 * 60,
        showCurrentTime: false,
        editable: false,
        orientation: 'top',
        locale: 'fr',
        tooltip: {
            followMouse: true,
            overflowMethod: 'cap'
        }};
    var timeline = new vis.Timeline(container, timeLineItems, timelineOptions, groups);// Create a Timeline
    //click itme to move to the marker attached
    document.getElementById('timeline').onclick = function (event) {
        var props = timeline.getEventProperties(event);
        if (props.item != null){
            var idItem = props.item;
            if (props.group == 0){
                var item = getGeoItem(idItem);
                var latitude = item.latitude;
                var longitude = item.longitude;
                var id = latitude.toString() + longitude.toString();
                for(var i in geoMarkers){
                    var markerID = geoMarkers[i].options.alt;
                    if (markerID == id){
                        geoMarkers[i].openPopup();
                    };
                }
                mymap.panTo([latitude,longitude],{animate: true});
                
            }
            if (props.group == 1){
                var item = getPhoneItem(idItem);
                var latitude = item.latitude;
                var longitude = item.longitude;
                var id = latitude.toString() + longitude.toString();
                for(var i in phoneMarkers){
                    var markerID = phoneMarkers[i].options.alt;
                    if (markerID == id){
                        phoneMarkers[i].openPopup();
                    };
                }
                mymap.panTo([latitude,longitude],{animate: true});
            }
        }
    }
    timeline.on('rangechanged', function (properties) {
            if(properties.byUser){
                var startDay = formatDate(timeline.getWindow().start);
                var endDay = formatDate(timeline.getWindow().end)
                document.getElementById('start').innerHTML = startDay; 
                document.getElementById('end').innerHTML = endDay;
                getPeriodDayMarkers(startDay, endDay);
            }
    });
}
/**********************Cozy Client JS***********************
***********************************************************/

    APP = document.querySelector('[role=application]');
    if( APP != null){
    var cozyOptions = {
        cozyURL: protocol + APP.dataset.cozyDomain,
        token: APP.dataset.cozyToken
    };
    cozy.client.init(cozyOptions);
    }
    /*console.log(window.cozy.client);
    console.log(window.cozy.bar);
    window.cozy.bar.init({appName: "Mon application"});*/

/**********************************************************
***********************************************************/    
    function CheckFavoris(val) {

        var element = document.getElementById('otherfavoris');
        if (val == 'Choisir le type' || val == 'others')
            element.style.display='block';
        else  
            element.style.display='none';
    }  
/**********************Initial Data***********************
***********************************************************/    
    function init() {
        initBind();
        var t0 = performance.now();
        getGeoPoint("dayByDayRadio");
        var t1 = performance.now();
        console.log("Call to getGeoPoint took " + (t1 - t0) + " milliseconds.");
        getPointFavoris();
        var t2 = performance.now();
        console.log("Call to getPointFavoris took " + (t2 - t1) + " milliseconds.");
        console.log("Call to all took " + (t2 - t0) + " milliseconds.");
        
    }
/***********************************************************
***********************************************************/
    function initBind(argument) {
        hideForm();
        $('.layerSwitcher [name=dataType]').change(function(e) {
        var targetID = e.target.id;
        
        switch(targetID) {
            case "agregatedRadio":
                hideDaySelector();
                displayForm();
                getGeoPoint("agregatedRadio");
                getPointFavoris();
                break;
            case "dayByDayRadio":
                hideForm();
                displayDaySelector();
                getGeoPoint("dayByDayRadio");
                getPointFavoris();
                break;
        }
    });
    $("#selectfavoris").change(function() {
        var val = this.value;
        var element = document.getElementById('otherfavoris');
        if (val == 'Choisir le type' || val == 'others')
            element.style.display='block';
        else  
            element.style.display='none';
    })
    }
/*** Fonction qui fait disparaitre le selecteur de date******
************************************************************/
function hideDaySelector() {
    document.getElementById('filter').style.display = "none";
}

/*** Fonction qui fait apparaitre le selecteur de date*******
************************************************************/
    function displayDaySelector() {
    document.getElementById('filter').style.display = "block";
}

/*** Fonction qui fait disparaitre le selecteur de date******
************************************************************/
    function displayForm() {
    /*document.getElementById('mostmode').style.display = "block";*/
    $('#mostmode').show();
    $('#pointfavorisform')[0].reset();
    $('#pointfavorisform input[name=favoris]').attr('checked',false);
}

/*** Fonction qui fait disparaitre le selecteur de date******
************************************************************/
    function hideForm() {
    $('#mostmode').hide();
    /*document.getElementById('mostmode').style.display = "none";*/
}
/**********************Get GeoPoint Data********************
***********************************************************/
    function getGeoPoint(mode) {
        var getGeoPointURL = cozyOptions.cozyURL + dataAPI + geopointDoctype + listDocsAPI;     
        $.ajax(getGeoPointURL, {
            type: "GET",
            beforeSend: function(request) {
            request.setRequestHeader("Authorization", "Bearer " + cozyOptions.token);
            },
            dataType: "json",
            success: function(data) {
                geoItems = [];
                dataItems =[];
                if(data && data.rows){
                    sortItemsByDate(data.rows);
                    var geoPoints = data.rows;
                    for(var i = 0; i < geoPoints.length; i += 1) {
                        var item = createGeoItems(geoPoints[i].doc);
                        if(item) {
                            geoItems.push(item);
                            dataItems.push(item);
                        }
                    }   
                }
                getPhoneCommunicationLog(mode);
                      
            },
            error: function() {
                alert("Une erreur est survenue lors de la récupération des données, si le problème persiste contactez un administrateur.");
                console.error("Error retrieving data from server");
            }
        })       
    }
    

/**************Get honeCommunicationLog Data****************
***********************************************************/
    function getPhoneCommunicationLog(mode) {
        var getPhoneCommunicationLogURL = cozyOptions.cozyURL + dataAPI + phoneCommunicationDoctype + listDocsAPI;
        $.ajax(getPhoneCommunicationLogURL, {
            type: "GET",
            beforeSend: function(request) {
            request.setRequestHeader("Authorization", "Bearer " + cozyOptions.token);
            },
            dataType: "json",
            success: function(data) {
                phoneItems = [];
                if(data && data.rows){
                    sortItemsByDate(data.rows);
                    var phoneCalls = data.rows;
                    for(var i = 0; i < phoneCalls.length; i += 1) {
                        var item = createPhoneItems(phoneCalls[i].doc);
                        if(item && item.latitude != "NULL" && item.longitude != "NULl"){
                            phoneItems.push(item);
                            dataItems.push(item);
                        }
                    }   
                }
                if(mode == "dayByDayRadio") {
                    initTimeLine();
                }
                if(mode == "agregatedRadio") {
                    getAggregateData(geoItems, phoneItems);
                }
                  
            },
            error: function() {
                alert("Une erreur est survenue lors de la récupération des données, si le problème persiste contactez un administrateur.");
                console.error("Error retrieving data from server");
            }
                
        });
    }

/**********************Get GeoPoint Data********************
***********************************************************/
    function getPointFavoris() {
        document.getElementById('success').innerHTML = "";
        document.getElementById('error').innerHTML = "";
        var getPointFavorisURL = cozyOptions.cozyURL + dataAPI + pointFavorisDoctype + listDocsAPI;
        $.ajax(getPointFavorisURL, {
            type: "GET",
            beforeSend: function(request) {
            request.setRequestHeader("Authorization", "Bearer " + cozyOptions.token);
            },
            dataType: "json",
            success: function(data) {
                if(data && data.rows){
                    favorisPoints = new Map();
                    favorisId = new Map();
                    var datas = data.rows;
                    for (var i = 0; i < datas.length; i++) {
                        if (datas[i].doc.hasOwnProperty("latitude") && datas[i].doc.hasOwnProperty("longitude") &&
                            datas[i].doc.hasOwnProperty("category")) {
                            var key = datas[i].doc.latitude + datas[i].doc.longitude;
                            favorisPoints.set(key, datas[i].doc.category);
                            favorisId.set(key, datas[i].doc._id);
                        }
                    }
                }               
            },
            error: function(xhr, ajaxOptions, thrownError) {
                if(xhr.status == 404) {
                    favorisPoints = new Map();
                    favorisId = new Map();
                    // Initial data type pointFavoris 
                    cozy.client.data.create(pointFavorisDoctype, {});
                }else{
                    alert("Une erreur est survenue lors de la récupération des données, si le problème persiste contactez un administrateur.");
                    console.error("Error retrieving data from server");
                }
            }
        });     
    }

/**********************Initial TimeLine*********************
***********************************************************/    
    function initTimeLine() {
        var recentDayGeo = geoItems[geoItems.length-1].start;
        var recentDayPhone = phoneItems[phoneItems.length-1].start;
        var recentDay = getLastDay(recentDayGeo, recentDayPhone);
        timelineOptions.start = new Date(recentDay);
        timeline.setOptions(timelineOptions);
        timeline.setData({
            groups: groups,
            items: dataItems
        });
        timeline.setWindow(formatStartDay(recentDay), formatEndDay(recentDay));
        
        getPeriodDayMarkers(recentDay, recentDay);
        document.getElementById('start').innerHTML =  recentDay; 
        document.getElementById('end').innerHTML = recentDay;

    }

/*** Move the timeline a given percentage to left or right***
********** @param {Number} percentage***********************/
    function move (percentage) {
        var range = timeline.getWindow();
        var interval = range.end - range.start;
        timeline.setWindow({
            start: range.start.valueOf() - interval * percentage,
            end:   range.end.valueOf()   - interval * percentage
        });
    }
    // attach events to the navigation buttons
    if(document.getElementById('zoomIn') != null){
        document.getElementById('zoomIn').onclick    = function () { timeline.zoomIn( 0.2);}
    }
    if(document.getElementById('zoomOut') != null){
        document.getElementById('zoomOut').onclick   = function () { timeline.zoomOut( 0.2);}
    }
    if(document.getElementById('moveLeft') != null){
        document.getElementById('moveLeft').onclick  = function () { move( 0.2); }
    }
    if(document.getElementById('moveRight') != null){
        document.getElementById('moveRight').onclick = function () { move(-0.2); }
    }

/******************Sort Data By TimeStamp***************
*******************************************************/
    function sortItemsByDate(items){
        items.sort(function (a, b) {
            if (a.hasOwnProperty("doc") && b.hasOwnProperty("doc")){
            return new Date(a.doc.timestamp) - new Date(b.doc.timestamp);
            }
        })
    }

/*** Fonction create geolocation item*****************
************* @param value: item data****************/
    function createGeoItems(value) {
        var marker;
        if(value.hasOwnProperty('timestamp') && value.hasOwnProperty('latitude') && value.hasOwnProperty('longitude')){
            marker = value;
            marker.start = value.timestamp.replace(/T|Z/g, " ");
            marker.className = GEOLOCITEM;
            marker.group = 0;
            marker.title = '<div class="data-tooltip"><p>Position: (' + value.latitude +', '+  value.longitude + ')</p><p>Timestamp: '+ value.start +'</div>'
            delete marker.timestamp;
            return marker
        }
        
    }

/********Fonction create phoneCommunication item***********
******* @param value: item data***************************/
    function createPhoneItems(value) {
        var marker;
        if(value.hasOwnProperty('timestamp') && value.hasOwnProperty('latitude') && value.hasOwnProperty('longitude')){
            marker = value;
            marker.start = value.timestamp.replace(/T|Z/g, " ");
            marker.typeMessage = value.type;
            marker.className = PHONECALLITEM;
            marker.group = 1;
            marker.title = '<div class="data-tooltip"><p>Numéro de contact: ' 
                    + value.partner+'</p><p>Type d\'appel: ' + value.typeMessage + '</p></div>'; 
            delete marker.timestamp;
            delete marker.type;
            return marker;
        }
        
    }

/*************Get Latest Data in DataBase****************
**************Format YY-MM-DD **************************/
    function getLastDay(recentDayGeo, recentDayPhone){
        var recentDay;
        if(recentDayGeo.localeCompare(recentDayPhone) == -1){
                recentDay = recentDayPhone;
            }
            else{
                recentDay = recentDayGeo;
            }
            recentDay = recentDay.split(" ")[0];
        return recentDay;
    }

/******* Format A Date to YY-MM-DD******************
**************@param date: date *******************/
    function formatDate(date) {
        var year = date.getFullYear() + "",
            month = (date.getMonth() + 1) + "",
            day = date.getDate() + "";
            hours = date.getHours() + "";
            minutes = date.getMinutes() + "";
            seconds = date.getSeconds() + "";
        if(month.length == 1) { month = "0" + month; }
        if(day.length == 1) { day = "0" + day; }
        if(hours.length == 1) { hours = "0" + hours; }
        if(minutes.length == 1) { minutes = "0" + minutes; }
        if(seconds.length == 1) { seconds = "0" + seconds; }
        return year + "-" + month + "-" + day;
    }

/**** Format A Start Date to YY-MM-DD 00:00:00*******
**************@param date: date ********************/
    function formatStartDay(startDay) {
        return new Date(startDay + " " +"00:00:00");
    }

/**** Format A End Date to YY-MM-DD 23:59:59*********
**************@param date: date ********************/
    function formatEndDay(endDay) {
        return new Date(endDay + " " +"23:59:59");
    }

/*** Fonction Which Allows Get Data From A Period*** 
**********"date-filter"****************************/
    function getPeriodDayMarkers(startDay, endDay) {
        geoTab = [];
        phoneTab = [];
        filterItems  = dataItems.filter(function (el){
            return (new Date(el.start).getTime() <= formatEndDay(endDay).getTime() && new Date(el.start).getTime() >= formatStartDay(startDay).getTime());
        });
        if(filterItems.length != 0) {
            for (var i = 0; i < filterItems.length; i++) {
                if (filterItems[i].className == GEOLOCITEM) {
                    geoInfo = selectGeoInfo(filterItems[i]);                    
                    if(geoInfo != null) {
                         geoInfo.push({start: filterItems[i].start, id: filterItems[i].id, itemType: GEOLOCITEM});                         
                    }else {
                        var item = createGeoMarker(filterItems[i]);
                        geoTab.push(item);
                    }                    
                }
                if (filterItems[i].className == PHONECALLITEM) {
                    phoneInfo = selectPhoneInfo(filterItems[i]);
                    if(phoneInfo != null) {
                        phoneInfo.push({start: filterItems[i].start, id: filterItems[i].id, itemType: GEOLOCITEM, 
                                msisdn: filterItems[i].msisdn, partner: filterItems[i].partner, typeMessage: filterItems[i].typeMessage});
                    }else {
                        var item = createPhoneMarker(filterItems[i]);
                        phoneTab.push(item);    
                    }
                }
            }
        }
        removerExistMarker();
        displayMarkers(geoTab, geoIcon, SHOWALL);
        displayMarkers(phoneTab, phoneIcon, SHOWALL);
        /*console.log(phoneTab.length);*/
    }


/**************Create GeoPoint Marker Data Format****
****************************************************/
    function createGeoMarker(geolocation){
        var marker;
        marker = new Object();
        marker.latitude = geolocation.latitude;
        marker.longitude = geolocation.longitude;
        marker.radius = geolocation.radius;
        marker.info = [];
        var info = new Object();
        info.start =  geolocation.start;
        info.itemType = GEOLOCITEM;
        info.id = geolocation.id;
        marker.info.push(info);
        return marker;
    }

/***Create PhoneCommunicationLog Marker Data Format***
*****************************************************/
    function createPhoneMarker(phonecall){
        var marker;
        marker = new Object();
        marker.latitude = phonecall.latitude;
        marker.longitude = phonecall.longitude;
        marker.info = [];
        var info = new Object();
        info.start =  phonecall.start;
        info.itemType = PHONECALLITEM;
        info.id = phonecall.id;
        info.msisdn = phonecall.msisdn;
        info.partner = phonecall.partner;
        info.typeMessage = phonecall.typeMessage;
        marker.info.push(info);
        return marker;
    }

/*****Clear Existing Markers Before add New One*********
*******************************************************/
    function removerExistMarker() {
        markers.clearLayers();
    }

/************Show Or Hide Marker Tooltip***************
******************************************************/
    function showhide(){
        if ($("#info").css('display') == "none"){
            $("#info").removeAttr('style');
            $("#showhide").text("Cacher");
        }else {
             $("#info").css('display', 'none');
             $("#showhide").text("Afficher");
        }
    }

/**********Check Same Location GeoPoint***************
*****************************************************/
    function selectGeoInfo(position){
        var lat = position.latitude;
        var lng = position.longitude;     
        for (var i = 0; i < geoTab.length; i++){
            
            if(geoTab[i].latitude == lat && geoTab[i].longitude == lng){
                if(geoTab[i].radius > position.radius){
                    geoTab[i].radius = position.radius;
                }
                return geoTab[i].info;
            }
        }

    }

/****Check Same Location PhoneCalls Point*************
*****************************************************/
    function selectPhoneInfo(phonecall){
        var lat = phonecall.latitude;
        var lng = phonecall.longitude;
        for (var i=0; i < phoneTab.length; i++){
            if (phoneTab[i].latitude == lat && phoneTab[i].longitude == lng){
                return phoneTab[i].info;
            }
        }
    } 

/*******Get GeoItem By Id*****************************
*****************************************************/
    function getGeoItem(id){
        for(key in geoItems) {
            if(geoItems[key].id == id) {
                return geoItems[key];
            }
        }
    }

/***********Get PhoneCalls By Id**********************
*****************************************************/
    function getPhoneItem(id){
        for(key in phoneItems) {
            if(phoneItems[key].id == id) {
                return phoneItems[key];
            }
        }
    }
/*********Draw PolyLine One Day Location Track*******
****************************************************/
    function drawPolyline(day) {

        var latlngs = [];
        for (var i = 0; i < filterItems.length; i++) {
            latlngs.push([filterItems[i].latitude, filterItems[i].longitude]);
        }
        var polyline = new L.polyline(latlngs,{color: "#808080",weight: 2,opacity: 1,smoothFactor: 1});
        /*var dashline= L.polylineDecorator(polyline,{
        patterns: [
            // defines a pattern of 10px-wide dashes, repeated every 20px on the line
            {offset: 10, repeat: 20, symbol: L.Symbol.dash({pixelSize: 10})}
        ]});*/
        var decorator = L.polylineDecorator(polyline);
        var arrowOffset = 0;
        var anim = setInterval(function() {
            decorator.setPatterns([
                {offset: arrowOffset+'%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 13, polygon: false, pathOptions: {stroke: true, color: "#449d44"}})}
            ]);
            if(++arrowOffset > 100){
                arrowOffset = 0;
            }
        }, 200);
        
        markers.addLayer(polyline).addTo(mymap);
        markers.addLayer(decorator).addTo(mymap);
    }  

/***********************************************************
***********************************************************/
    function showStartAnimate() {
        var startDay = document.getElementById("start").innerHTML;
        getPeriodDayMarkers(startDay, startDay);
        drawPolyline(startDay);
        timeline.setWindow(formatStartDay(startDay), formatEndDay(startDay));
     } 

/***********************************************************
***********************************************************/
    function showEndAnimate() {
        var endDay = document.getElementById("end").innerHTML;
        getPeriodDayMarkers(endDay, endDay);
        drawPolyline(endDay);
        timeline.setWindow(formatStartDay(endDay), formatEndDay(endDay));
     }

/************************************************************
************************************************************/
    
    function getAggregateData(geoItems, phoneItems) {
        top5Geo = null;
        top5Phone = null;
        geoAggregate = [];
        phoneAggregate = [];
        var geoInfoAgg = [];
        var phoneIngoAgg = [];
        if (geoItems.length != 0) {
            for (var i = 0; i < geoItems.length; i++) {
                geoInfoAgg = selectGeoInfoAggregate(geoItems[i]);
                //console.log(geoInfoAgg);
                if (geoInfoAgg != null) {
                    geoInfoAgg.push({start: geoItems[i].start, id: geoItems[i]._id, itemType: GEOLOCITEM}); 
                } else {
                    var item = createGeoMarker(geoItems[i]);
                    geoAggregate.push(item);
                }    
            }
        }
        //console.log(geoAggregate);
        if (phoneItems.length != 0) {
            for (var i = 0; i < phoneItems.length; i++) {
                phoneIngoAgg = selectPhoneInfoAggregate(phoneItems[i]);
                if(phoneIngoAgg != null) {
                    phoneIngoAgg.push({start: phoneItems[i].start, id: phoneItems[i].id, itemType: GEOLOCITEM, 
                    msisdn: phoneItems[i].msisdn, partner: phoneItems[i].partner, typeMessage: phoneItems[i].typeMessage});
                }else {
                    var item = createPhoneMarker(phoneItems[i]);
                    phoneAggregate.push(item);    
                } 
            }
        }
        geoAggregate.sort(function (a, b){
            if (a.hasOwnProperty("info") && b.hasOwnProperty("info")){
            return b.info.length - a.info.length;
            }
        });
        phoneAggregate.sort(function (a, b){
            if (a.hasOwnProperty("info") && b.hasOwnProperty("info")){
            return b.info.length - a.info.length;
            }
        });
        top5Geo = geoAggregate.slice(0,5);
        top5Phone = phoneAggregate.slice(0,5);
        
        removerExistMarker();
        displayMarkers(top5Geo, geoIcon, FAVORIS);
        displayMarkers(top5Phone, phoneIcon, FAVORIS);
        /*addFavoris();*/
        $("#latitude").prop("readonly", true);
        $("#longitude").prop("readonly", true);
        
 }

/****Check Same Geo Aggregated Point*************
*****************************************************/
    function selectGeoInfoAggregate(position) {
        var lat = position.latitude;
        var lng = position.longitude;     
        for (var i = 0; i < geoAggregate.length; i++){
            if(geoAggregate[i].latitude == lat && geoAggregate[i].longitude == lng){
                if(geoAggregate[i].radius > position.radius){
                    geoAggregate[i].radius = position.radius;
                }
                return geoAggregate[i].info;
            }
        //console.log(geoAggregate[i].info)
        }

    }

/****Check Same PhoneCalls Aggregated Point***********
*****************************************************/
    function selectPhoneInfoAggregate(phonecall){
        var lat = phonecall.latitude;
        var lng = phonecall.longitude;
        for (var i=0; i < phoneAggregate.length; i++){
            if (phoneAggregate[i].latitude == lat && phoneAggregate[i].longitude == lng){
                return phoneAggregate[i].info;
            }
        }
    } 

/******* Create GeoPoints Marker *********************
*****************************************************/
    function displayMarkers(data, dataType, mode) {
        var iconType;
        for (var i = 0; i < data.length; i++){
            geoInfo = data[i];
            var favorisType = null;
            var pointkey = geoInfo.latitude.toString() + geoInfo.longitude.toString();
            if (favorisPoints.has(pointkey)) {
                favorisType = favorisPoints.get(pointkey);
                iconType = selectfavorisType(favorisType);
                marker = L.marker([geoInfo.latitude, geoInfo.longitude],{alt:geoInfo.latitude.toString() + geoInfo.longitude.toString(), icon: iconType});
            }else{
                iconType = dataType;
                marker = L.marker([geoInfo.latitude, geoInfo.longitude],{alt:geoInfo.latitude.toString() + geoInfo.longitude.toString(), icon: iconType});
            }            
            geoMarkers.push(marker);
            markers.addLayer(marker).addTo(mymap);
            /****** Creation des info de la popup *******/
            var str = createGeoPointPopup(geoInfo, favorisType);
            marker.bindPopup(str);
            if(mode == FAVORIS) {
                marker.addEventListener('click',function(e){
                    var target = e.target;
                    var latlgn = target._latlng;
                    var latitude = latlgn.lat;
                    var longitude = latlgn.lng;
                    $('#latitude').val(latitude);
                    $('#longitude').val(longitude);
                    $('#addPoint').prop('disabled', false);
                    $('#deletePoint').prop('disabled', false);
                    $('#modifyPoint').prop('disabled', false);
                    document.getElementById('success').innerHTML = "";
                    document.getElementById('error').innerHTML = "";
                },false);
            } else {
                marker.addEventListener('click',function(){
                    var geoContent = this._popup.getContent();
                    var item_id= geoContent.split('Id: ')[1].split('</p>')[0];
                    timeline.setSelection(item_id,{focus: true});
                },false);
            }
        }
    }

/*********Add Point Favoris*******************************************/
/*********************************************************************/    
    function addFavoris() {
        document.getElementById('success').innerHTML = "";
        document.getElementById('error').innerHTML = "";
        var errorMessage = "";
        var successMessage = "";       
        var point = {};
        var latitude = $('#latitude').val();
        var longitude = $('#longitude').val();
        var favoris = $("#pointfavorisform :checked").val();
        var pointkey = latitude + longitude;
        if(favoris.length == 0 || favoris == "others") {
            favoris = $("#otherfavoris").val()
        }
        if(!favorisPoints.has(pointkey)) {
            if(latitude.length != 0 && longitude.length != 0 && favoris.length != 0 && favoris != "others"){
                point['latitude'] = latitude;
                point['longitude'] = longitude;
                point['category'] = favoris;
                cozy.client.data.create(pointFavorisDoctype, point)
                .then(function (result) {
                    successMessage = "OK";
                    if(successMessage) {
                        document.getElementById('success').innerHTML = successMessage;
                    }
                    favorisPoints.set(pointkey, favoris);
                    favorisId.set(pointkey, result._id);
                    removerExistMarker();
                    displayMarkers(top5Geo, geoIcon, FAVORIS);
                    displayMarkers(top5Phone, phoneIcon, FAVORIS);
                    $('#pointfavorisform')[0].reset();
                    $('#addPoint').prop('disabled', true);
                    $('#otherfavoris').hide();
                    
                });
            } else {
                errorMessage = "Un champ de formulaire n'est pas valide";
            }
        }else {
            errorMessage = "Ce point est déjà un point favoris";
        }
        
        if(errorMessage) {
            document.getElementById('error').innerHTML = errorMessage;
        }
        
    }

/*********Add Point Favoris*******************************************/
/*********************************************************************/ 
    function modifyFavoris() {
        document.getElementById('success').innerHTML = "";
        document.getElementById('error').innerHTML = "";
        var errorMessage = "";
        var successMessage = "";
        var latitude = $('#latitude').val();
        var longitude = $('#longitude').val();
        var favoris = $("#pointfavorisform :checked").val();
        var pointkey = latitude + longitude;
        if(favoris.length == 0 || favoris == "others") {
            favoris = $("#otherfavoris").val()
        }
        if(favorisId.has(pointkey)) {
            if(latitude.length != 0 && longitude.length != 0 && favoris.length != 0 && favoris != "others"){
                var modifyField = {category: favoris};
                var modifyId = favorisId.get(pointkey)
                cozy.client.data.updateAttributes(pointFavorisDoctype, modifyId, modifyField)
                .then(function() {
                    successMessage = "OK";
                    if(successMessage) {
                        document.getElementById('success').innerHTML = successMessage;
                    }
                    favorisPoints.set(pointkey, favoris);
                    favorisId.set(pointkey, modifyId);
                    removerExistMarker();
                    displayMarkers(top5Geo, geoIcon, FAVORIS);
                    displayMarkers(top5Phone, phoneIcon, FAVORIS);
                    $('#modifyPoint').prop('disabled', true);
                    $('#pointfavorisform')[0].reset();
                    $('#otherfavoris').hide();
                });
            }else {
                errorMessage = "Un champ de formulaire n'est pas valide";
            }
        }else {
            errorMessage = "Veuillez d'abord ajouter ce point, puis le modifier"
        }
        if(errorMessage) {
            document.getElementById('error').innerHTML = errorMessage;
        }
        
    }

/*********Delete Point Favoris****************************************/
/*********************************************************************/
    function deleteFavoris() {
        document.getElementById('success').innerHTML = "";
        document.getElementById('error').innerHTML = "";
        var errorMessage = "";
        var successMessage = "";
        var latitude = $('#latitude').val();
        var longitude = $('#longitude').val();
        var pointkey = latitude + longitude;
        if(latitude.length == 0 || longitude.length == 0) {
            errorMessage = "N'oubliez pas de click le point";
        }
        if(latitude.length != 0 && longitude.length != 0) {
            if (favorisId.has(pointkey)) {
                var pointId = favorisId.get(pointkey);
                cozy.client.data.find(pointFavorisDoctype, pointId)
                .then(function(result) {
                    cozy.client.data.delete(pointFavorisDoctype, result)
                    .then(function(result) {
                        favorisPoints.delete(pointkey);
                        favorisId.delete(pointkey);
                        removerExistMarker();
                        displayMarkers(top5Geo, geoIcon, FAVORIS);
                        displayMarkers(top5Phone, phoneIcon, FAVORIS);
                        successMessage = "OK";
                        if(successMessage) {
                            document.getElementById('success').innerHTML = successMessage;
                        }
                        $('#deletePoint').prop('disabled', true);
                    })
                });
            } else {
                 errorMessage = "Le point que vous avez sélectionné n'est pas votre lieu préféré";
            }
        }
        if(errorMessage) {
            document.getElementById('error').innerHTML = errorMessage;
        }
        
    }
/*********Capitalize First Letter*************************************/
/*********************************************************************/
    function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
    }
/*********************************************************************/
/*********************************************************************/
    function selectfavorisType(favorisType) {
        var iconType;
        switch(favorisType) {
            case "maison":
                iconType = homeIcon;
            break;
            case "travail":
                iconType = worklIcon;
            break;
            case "sport":
                iconType = sportIcon;
            break;
            case "marche":
                iconType = shopIcon;
            break;
            default:
                iconType = otherIcon;
        }
        return iconType
    }
/*********************************************************************/
/*********************************************************************/
    function createPhonePopup(phoneInfo, favorisType) {
        if (phoneInfo.info.length != 1){
            if (favorisType == null) {
                var strmulti = " <div class='titre'><h5>Nombre de communications = "+phoneInfo.info.length+"</h5></div><br>"+
                      " <div id='info' style='display:none'>";
            } else {
                var strmulti = " <div class='titre'><h5> Nombre de communications = "+phoneInfo.info.length+"</h5><h5>Type de point = " +
                capitalizeFirstLetter(favorisType) + "</h5></div><br>"+
                      " <div id='info' style='display:none'>";
            }
            var infoComm = "";
            for (var l=0;  l<phoneInfo.info.length; l++){
                infoComm =  infoComm +
                '<div class="markerPopup">' + '<p>Numéro de contact: '+ phoneInfo.info[l].partner +
                '</p><p>Type d\'appel: '+ phoneInfo.info[l].typeMessage + 
                '</p><p>Temps : ' + phoneInfo.info[l].start +
                '</p><p hidden>Id: ' + phoneInfo.info[l].id +'</p></div>' 
            }
            var str =   strmulti + infoComm +
                "</div>"+
                "<button class = 'btn btn-success btn-sm' id='showhide' onclick='showhide()' >Afficher</button>";
        } else {
            var str =  '<div class="markerPopup" id="info">'+ 
                '<p>Numéro de contact: '+ phoneInfo.info[0].partner +
                '</p><p>Type d\'appel: '+ phoneInfo.info[0].typeMessage + 
                '</p><p>Temps: ' + phoneInfo.info[0].start +
                '</p><p><p hidden>Id: ' + phoneInfo.info[0].id +'</p></div>'
        }
        return str
    }
/*********************************************************************/
/*********************************************************************/
    function createGeoPointPopup(geoInfo, favorisType) {

        if (geoInfo.info.length != 1){
           if (favorisType == null) {
                var strmulti = " <div class='titre'><h5>Nombre de geolocations = " + geoInfo.info.length + "</h5></div>" +
                      " <div id='info' style='display:none'>"
            } else {
                var strmulti = " <div class='titre'><h5> Nombre de geolocations = " + geoInfo.info.length + "</h5><h5>Type de point = " +
                capitalizeFirstLetter(favorisType) + "</h5></div>" +
                      " <div id='info' style='display:none'>"
            }
            var infoComm = "";
            for (var l=0;  l<geoInfo.info.length; l++){
                infoComm =  infoComm +
                    '<div class="markerPopup">' + /*'Latitude: ' + geoInfo.latitude + 
                    '<p>Longitude: '+ geoInfo.longitude + 
                    '</p><p>Radius: ' + geoInfo.radius +
                    '</p><p>Date: ' + geoInfo.info[l].start +
                    '</p><p hidden>Id: ' + geoInfo.info[l].id +'</p></div><br>'*/
                    '<p>Temps : ' + geoInfo.info[l].start +
                    '</p><p hidden>Id: ' + geoInfo.info[l].id +'</p></div>'

            }
            var str =   strmulti + infoComm +
                    "</div>"+
                    "<button class = 'btn btn-success btn-sm' id='showhide' onclick='showhide()' >Afficher</button>";
        } else {
            var str =  /*'<div>Latitude: ' + geoInfo.latitude + 
                    '<br>Longitude: '+ geoInfo.longitude + 
                    '<br>Radius: ' + geoInfo.radius +
                    '<br>Date: ' + geoInfo.info[0].start +
                    '<br><p hidden>Id: ' + geoInfo.info[0].id +'</p></div>'*/
                    '<div class="markerPopup">Temps : ' + geoInfo.info[0].start +
                    '<p hidden>Id: ' + geoInfo.info[0].id +'</p></div>'
        }
        return str
    }