/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：属性查询相关方法
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var GeneralQuery = {};
var currentRoomCenter;//当前井室的中心点坐标
var queryPropertyObj = [];//“属性查看”高亮对象集合
var thisPropertyHtml = null;
var poiLayers = null;//所有POI图层
var queryHtmlBalloon =null;
var buildingData = null;//建筑详细信息
(function () {
    //功能：拾取查询-发布图层对象
    //参数：pObj拾取对象
    //返回：无
    var onPickObjectEx = function (pObj) {
        var earth = seearth;
        if(queryPropertyObj && queryPropertyObj.length){
            for(var k = 0; k < queryPropertyObj.length; k++){
                queryPropertyObj[k].StopHighLight();
            }
            queryPropertyObj = [];
        }
        if(pObj==null){
            alert("对象不存在");
            return;
        }
        queryPropertyObj.push(pObj);
        poiLayers = LayerManagement.POILAYERS;
        var ispoi = false;
        var poiLayerId = '';
        for(var i=0; i<poiLayers.length; i++){
            if(pObj.ParentGuid == poiLayers[i].name){
                ispoi = true;
                poiLayerId = poiLayers[i].id;
                break;
            }
        }
        if(!ispoi){
            pObj.Underground = true;
            pObj.ShowHighLight();
            parentLayerName = pObj.GetParentLayerName();
            if (parentLayerName == "" || parentLayerName == null) {
                alert("获得父层名称失败！");
                return false;
            }

            key = pObj.GetKey();

            showpropertyQuery(earth, parentLayerName, key, pObj);
        } else {
            showpropertyQuery(earth, poiLayerId, 'poi', pObj);
        }
    };

    /**
     * 通过建筑id从数据库查询模型属性
     * @param  {[type]} buildId [建筑ID]
     * @param  {[type]} pObj    [模型对象]
     * @param  {[type]} showObj [显示数据信息]
     * @return {[type]}         [description]
     */
    var searchBuildingData = function (buildId,pObj,showObj){
        var xml ='<QUERY>' +
            '<CONDITION><AND>' +
            '<ID tablename="CPBUILDING">=\''+buildId+'\'</ID>' +
            '</AND></CONDITION>' +
            '<RESULT><CPBUILDING /></RESULT>' +
            '</QUERY>';
        $.post(top.STAMP_config.service.query, xml, function(data){
            var record = $.xml2json(data).record;
            if(record){
                buildingData = record;
                showDialog("html/query/BuildTable.html","QueryProperty")
            }else{
                initObjNormal(pObj.GetLonLatRect(),showObj);
            }
        }, "text");
    };

    /**
     * 通过建筑id从数据库查询简单建筑属性
     * @param  {[type]} buildId [建筑ID]
     * @param  {[type]} pObj    [模型对象]
     * @param  {[type]} showObj [显示数据信息]
     * @return {[type]}         [description]
     */
    var searchSimpleBuildData = function(buildId,pObj,showObj){
        var xml ='<QUERY>' +
            '<CONDITION><AND>' +
            '<ID tablename="CPSIMPLEBUILD">=\''+buildId+'\'</ID>' +
            '</AND></CONDITION>' +
            '<RESULT><CPSIMPLEBUILD /></RESULT>' +
            '</QUERY>';
        $.post(top.STAMP_config.service.query, xml, function(data){
            var record = $.xml2json(data).record;
            if(record){
                var showLineHtml = "<table>"
                for(var i in record){
                    var displayName = null;
                    switch(i){
                        case "CPSIMPLEBUILD.BASEAREA": displayName = "基底面积";
                        break;
                        case "CPSIMPLEBUILD.FLOOR": displayName = "层数";
                        break;
                        case "CPSIMPLEBUILD.FLOORHIGHT": displayName = "层高";
                        break;
                        case "CPSIMPLEBUILD.NAME": displayName = "建筑名称";
                        break;
                        case "CPSIMPLEBUILD.TOTALAREA": displayName = "总面积";
                        break;
                        case "CPSIMPLEBUILD.YDNAME": displayName = "用地";
                        break;
                    }
                    if(!displayName){
                        continue;
                    }
                    showLineHtml += '<td class="col w75p" >'+ displayName +':</td>';
                    showLineHtml += '<td class="col w25p" >' + record[i] + '</td>';
                    showLineHtml += '</tr>';
                }
                showLineHtml += "</table>";
                thisPropertyHtml = showLineHtml;
                showDialog("html/query/normalObjProperty.html","QueryProperty")
            }else{
                initObjNormal(pObj.GetLonLatRect(),showObj);
            }
        }, "text");
    }

    //功能：拾取查询-用户自定义对象
    //参数：pObj拾取对象
    //返回：无
    var onPickObject = function(pObj){
        if(queryPropertyObj && queryPropertyObj.length){
            for(var k = 0; k < queryPropertyObj.length; k++){
                queryPropertyObj[k].StopHighLight();
            }
        }
        try{
            pObj.ShowHighLight();
            queryPropertyObj
        }catch(e){
        }
        var earth = seearth;
        var llr=pObj.GetLonLatRect();
        var guid = pObj.GUID;
        var rtti = pObj.rtti;
        var showObj = {
            'displayFields':['East','MaxHeight', 'MinHeight', 'North',"South","West"],
            'East':llr.East,
            'MaxHeight': llr.MaxHeight,
            'MinHeight': llr.MinHeight,
            'North': llr.North,
            'South':llr.South,
            'West':llr.West
        };
        if(rtti == 223){
            searchBuildingData(guid,pObj,showObj);
            return;
        }else if(rtti == 280 || rtti == 207){
            searchSimpleBuildData(guid,pObj,showObj);
            return;
        }
        initObjNormal(pObj.GetLonLatRect(),showObj);
    };

    /**
     * 属性查询
     * @return {[type]} [description]
     */
    var propertyQuery = function () {
        var earth = seearth;
        earth.Environment.SetCursorStyle(32512);
        earth.Event.OnPickObjectEx = onPickObjectEx;//获取的为一般的数据
        earth.Event.OnPickObject = onPickObject;
        earth.Event.OnLBDown = function(p2) {
            function _onlbd(p2) {
                earth.Event.OnLBUp = function(p2) {
                    earth.Event.OnLBDown = function(p2) {
                        _onlbd(p2);
                    };
                };
                earth.Query.PickObject(511, p2.x, p2.y);
            }
            _onlbd(p2);
        };
        earth.Event.OnRBDown = function(){
            earth.Event.OnPickObjectEx = function () {};
            earth.Event.OnPickObject = function () {};
            earth.Event.OnLBDown = function () {};
            earth.Event.OnLBUp = function () {};
            earth.Query.FinishPick();
            earth.Environment.SetCursorStyle(209);
            top.QueryPropertyBtn = false;
        }
    };

    //功能：显示一般的数据气泡（公共方法）
    //参数：rect矩形范围，showObj显示的数据集合,type查询对象的数据类型（POI或其他对象）
    function initObjNormal(rect,showObj,type){
        var earth = seearth;
        var config = top.STAMP_config;
        if (queryHtmlBalloon) {
            queryHtmlBalloon.DestroyObject();
            queryHtmlBalloon = null;
        }
        var displayFields = showObj.displayFields;
        if(type == 'point'){
            var centerX = rect.Longitude;
            var centerY = rect.Latitude;
            var centerZ = rect.Altitude;
        }else{
            var north = rect.North;
            var south = rect.South;
            var east = rect.East;
            var west = rect.West;
            var up = rect.MaxHeight;
            var bottom = rect.MinHeight;
            var centerX = (east + west) / 2;
            var centerY = (north + south) / 2;
            var centerZ = (up + bottom) / 2;
        }
        var showLineHtml = '<table>';
        for(var i=0; i<displayFields.length; i++){
            showLineHtml = showLineHtml + '<tr>';
            var displayName = displayFields[i];
            var goZH = {
                'East' : "东(经度)",
                'MaxHeight' : "最大高度",
                'MinHeight' : "最小高度",
                'North' : "北(纬度)",
                'South' : "南(纬度)",
                'West' : "西(经度)"
            };
            displayName = goZH[displayName];
            showLineHtml = showLineHtml + '<td class="col w75p" >'+ displayName +':</td>';
            showLineHtml = showLineHtml + '<td class="col w25p" >' + showObj[displayFields[i]] + '</td>';
            showLineHtml = showLineHtml + '</tr>';
        }
        showLineHtml = showLineHtml + '</table>';
        thisPropertyHtml = showLineHtml;
        showDialog("html/query/normalObjProperty.html","QueryProperty")
    }

    /**
     * 查询模型的显示详细信息
     * @param  {[type]} key   [description]
     * @param  {[type]} layer [description]
     * @param  {[type]} pObj  [description]
     * @return {[type]}       [description]
     */
    function initModelValue(key,layer,pObj){
        var earth = seearth;
        if(pObj != null){
            if (queryHtmlBalloon) {
                queryHtmlBalloon.DestroyObject();
                queryHtmlBalloon = null;
            }
            var rect = pObj.GetLonLatRect();
            var north = rect.North;
            var south = rect.South;
            var east = rect.East;
            var west = rect.West;
            var up = rect.MaxHeight;
            var bottom = rect.MinHeight;

            var attrXml = layer.SearchResultFromLocal.GotoPage(0);
            var attrData = $.xml2json(attrXml);
            if(attrData.SearchResult != null && attrData.SearchResult.total > 0){
                if(attrData.SearchResult.ModelResult != null){
                    attrData = attrData.SearchResult.ModelResult.ModelData;
                }else if(attrData.SearchResult.VectorResult != null){
                    attrData = attrData.SearchResult.VectorResult.VectorData;
                }
                if($.isArray(attrData)){
                    attrData = attrData[0];
                }
            } else{
                attrData = null;
            }

            var htmlStr =  '<table>';
            if(attrData == null){
                htmlStr = htmlStr + '<tr>';
                htmlStr = htmlStr + '<td  class="col w75p" >图层:</td>';
                htmlStr = htmlStr + '<td class="col w25p" >' + layer.Name + '</td>';
                htmlStr = htmlStr + '</tr>';
                htmlStr = htmlStr + '<tr>';
                htmlStr = htmlStr + '<td class="col w75p" >名称:</td>';
                htmlStr = htmlStr + '<td class="col w25p" >' + key + '</td>';
                htmlStr = htmlStr + '</tr >';
                htmlStr = htmlStr + '</table>';
            }else{

                for(var i in attrData){
                    if(i == "LonLatBox" || i=="US_KEY"){
                        continue;
                    }
                    var thisName = i;
                    switch(i){
                        case "SE_NAME": thisName = "名称";break;
                        case "US_EAST": thisName = "东(经度)";break;
                        case "US_WEST": thisName = "西(经度)";break;
                        case "US_SOUTH": thisName = "南(纬度)";break;
                        case "US_NORTH": thisName = "北(纬度)";break;
                        case "US_TOP": thisName = "顶部高程";break;
                        case "US_BOTTOM": thisName = "底部高程";break;
                        case "ParentLayer": thisName = "父图层";break;
                    }
                    htmlStr = htmlStr + '<tr>';
                    htmlStr = htmlStr + '<td class="col w75p" >' + thisName + '</td>';
                    htmlStr = htmlStr + '<td class="col w25p" >  ' + attrData[i] + '</td>';
                    htmlStr = htmlStr + '</tr>';
                }
                htmlStr = htmlStr + '</table>';
            }
            thisPropertyHtml = htmlStr;
            showDialog("html/query/normalObjProperty.html","QueryProperty");
        }
    }

    /**
     * 显示属性信息
     * @param  {[type]} earth           [三维球]
     * @param  {[type]} parentLayerName [图层名称（包括guid和类型）]
     * @param  {[type]} key             [查询对象的关键字]
     * @param  {[type]} pObj            [查询对象]
     * @return {[type]}                 [description]
     */
    function showpropertyQuery(earth, parentLayerName, key, pObj) {
        function parseLocation() {
            var results = {};
            results[key] = parentLayerName;
            return results;
        };
        if(parentLayerName.indexOf('=')>-1){
            var params = parseLocation();
            //根据图层名称字符串判断是模型图层还是管线数据图层
            var cArr = parentLayerName.split("=");
            var cArr = cArr[1].split("_");
            var layer = earth.LayerManager.GetLayerByGUID(cArr[0]);
            var keyFieldInRealData = "US_KEY";
        }
        if(parentLayerName == 'userLayer'){
            var showObj = {
                guid:pObj.Guid,
                displayFields:['guid']
            };
            var rect = pObj.GetLonLatRect();
            initObjNormal(pObj.GetLonLatRect(),showObj);
        }
        if(key=='poi'){
            var poiLayer = earth.LayerManager.GetLayerByGUID(parentLayerName);
            var result = poiLayer.SearchResultFromLocal.GotoPage(0);
            result = $.xml2json(result);
            if(result.SearchResult.total != 1){
                return;
            }
            var showObj = {
                displayFields:[]
            };
            var resultData = result.SearchResult.POIResult.POIData;
            for(var i in resultData){
                showObj.displayFields.push(i);
                showObj[i] = resultData[i];
            }
            initObjNormal(pObj,showObj,'point');
        }
        //小品图层或者楼块图层
        else if(layer.LayerType.toLowerCase() == 'billboard' || layer.LayerType.toLowerCase() == 'block' ){

            var result = layer.SearchResultFromLocal.GotoPage(0);
            var result = $.xml2json(result);
            if(result != null && result.SearchResult!=null && result.SearchResult.ModelResult!=null && result.SearchResult.ModelResult.ModelData != null){
                var data = result.SearchResult.ModelResult.ModelData;
                var showObj = {
                    'displayFields':['图层名','名称', 'SE_ID', 'LonLatBox'],
                    '图层名':layer.Name,
                    '名称': data.SE_NAME,
                    'SE_ID': data.SE_ID,
                    'LonLatBox': data.LonLatBox
                };
                for(var itemKey in data){
                    var keyLower = itemKey.toLowerCase();
                    if(keyLower == "id" || keyLower == "name" || keyLower == "se_name"|| keyLower == "se_id"|| keyLower == "lonlatbox"){
                        continue;
                    }
                    showObj[itemKey] = data[itemKey];
                    showObj["displayFields"].push(itemKey);
                }
                initObjNormal(pObj.GetLonLatRect(),showObj);
            }
        } else if(layer.LayerType.toLowerCase() == 'gisvector' || layer.LayerType.toLowerCase() == 'gispoi'){
            var result = layer.SearchResultFromGISServer.GotoPage(0);
            var resultObj = $.xml2json(result);
            if(resultObj.Result != null && resultObj.Result.Record != null){
                var record = resultObj.Result.Record;
                var showObj = {};
                showObj.displayFields = ['名称'];
                for(var key in record){
                    if(key=='SHAPE')
                        continue;
                    if(key=='NAME'){
                        showObj['名称'] = record.NAME;
                    } else {
                        showObj[key] = record[key];
                        showObj.displayFields.push(key);
                    }
                }
                var rect = pObj.GetLonLatRect();
                initObjNormal(rect,showObj);
            }
        }else if(layer.LayerType.toLowerCase()== "pipeline"){
            if (queryHtmlBalloon) {
                queryHtmlBalloon.DestroyObject();
                queryHtmlBalloon = null;
            }
            var pObjs = [];
            var pObjGUID = pObj.Guid;
            pObjs.push(pObj);
            queryPropertyObj = pObjs;
            currentRoomCenter = pObj.GetLonLatRect().Center;
            var parentLayerName = pObj.GetParentLayerName();
            var layer = earth.LayerManager.GetLayerByGUID(parentLayerName.split("_")[0]);
            var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
            var url = loaclUrl+ "/html/query/propertyQuery.html?guid=" + pObjGUID + "&parentLayerName=" + parentLayerName + "&key=" + key + "&objs=" + pObjs;
            top.showDialog(url, "QueryProperty");//属性查询
        }else{
            var pObjs = [];
            var pObjGUID = pObj.Guid;
            pObjs.push(pObj);
            queryPropertyObj = pObjs;
            if (cArr.length > 1) {
                var bLine = parentLayerName.indexOf("container") > - 1;
                var _type = 0;
                if (bLine) _type = 1;
                if (layer) {
                    //获得关键字段
                    keyFieldInRealData = parent.getName("US_KEY", _type, true);
                }
                //根据关键字段，拼接查询条件
                var strPara = "(and,equal," + keyFieldInRealData + "," + key + ")";
                var param = layer.QueryParameter;
                param.Filter = strPara;
                param.QueryType = 16; 
                param.QueryTableType = (bLine ? 1: 0);
                param.PageRecordCount = 1;
                //进行查询
                var result = layer.SearchFromGISServer();
                //显示查询结果
                query(result.GotoPage(0), layer.Guid, layer.Name, bLine);
            } else {
                //如果是模型图层，没有进行进一步的查询，就把当前获得的基本信息进行了显示
                $("#divPointResult").show();
                $("#divLineResult").hide();
                initModelValue(key, layer,pObj);
            }
        }
    }

    GeneralQuery.propertyQuery = propertyQuery;
})();