/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：方案导入
 * 注意事项：该文件方法仅为方案导入使用
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/

if (!STAMP) {
    var STAMP = {};
}

STAMP.ProjImport = function (earth, dataProcess, generateEdit) {
    var projManager = {};
    var generateEditDll = generateEdit;
    var imgPathMgr = "../../image/project/";    // 方案树图标路径，相对管理页面的路径
    var imgPathInves = "image/project/";         // 方案树图标路径，相对审批树页面的路径（即index页面）
    var sep = "-";    // 分隔符，特殊节点（如规划专题、方案的阶段）ID由项目ID+sep+编码组成
    var pjFolderLink = earth.RootPath + "temp\\";
    var pjPath;
    var planPrjName;
    var m_importLayerParams = new ActiveXObject("Scripting.Dictionary"); 
    var m_projectOffsetList = new ActiveXObject("Scripting.Dictionary");
    
    var spatialRef;
    var spatialRefFile;
    /**
     * 保存每一个添加到数据库中图层的辅助信息：键值为图层guid
     * shp类型数据：对象包括ogr图层、datum和类型（parcel,roadline,simplebuilding和greenland）
     * 模型类型数据：对象包括文件路径、模型文件夹名称和类型（buildingmodel和groundmodel）
     */
    
    var importCurrent = 0;
    var importTotal = 0;
    var asyncTotal = 0;
    var importItem = null;
    var operSeqMgr = null;
    /**
     * 保存所有需要的数据库中的空间图层属性信息，键值为图层guid
     */
    var editLayers=this.editLayers;
    $.support.cors = true; //开启jQuery跨域支持
    $.ajaxSetup({
        async: false  // 将ajax请求设为同步
    });
    /**
     * 删除数组中的重复元素
     * @return {Array} 返回一个新的数组
     */
    var makeUnique = function (arr) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            if ($.inArray(arr[i], result) == -1) {
                result.push(arr[i]);
            }
        }
        return result;
    };
    
    /**
     * 从数据库中查询数据
     * @param serviceUrl 查询服务地址
     * @param xmlQuery 查询XML语句
     * @return {Array} 返回结果，如果没有查到符合条件的内容，返回空数组
     * @private
     */
    var _queryData = function (serviceUrl, xmlQuery) {
        var result = [];
        var res = dbUtil(serviceUrl, xmlQuery);
        res = $.xml2json(res).record;
        if (res) {
            if ($.isArray(res)) {
                result = res;
            } else {
                result.push(res);
            }
        }
        return result;
    };

    /**
    * 封装装载XML的方法,并返回XML文档的根元素节点。
    * @param flag true时参数xml表示xml文档的名称；false时参数xml是一个字符串，其内容是一个xml文档
    * @param xml 根据flag参数的不同表示xml文档的名称或一个xml文档的字符串表示
    */
    var loadXML = function(flag,xml){
        var xmlDoc;
        //针对IE浏览器
        if(window.ActiveXObject || window.ActiveXObject.prototype){
        var aVersions = ["MSXML2.DOMDocument.6.0", "MSXML2.DOMDocument.5.0","MSXML2.DOMDocument.4.0","MSXML2.DOMDocument.3.0",
        "MSXML2.DOMDocument","Microsoft.XmlDom"];
        for (var i = 0; i < aVersions.length; i++) {
        try {
        //建立xml对象
        xmlDoc = new ActiveXObject(aVersions[i]);
        break;
        } catch (oError) {
        }
        }
        if(xmlDoc != null){
        //同步方式加载XML数据
        xmlDoc.async = false;
        //根据XML文档名称装载
        if(flag == true){
        xmlDoc.load(xml);
        } else{
        //根据表示XML文档的字符串装载
        xmlDoc.loadXML(xml);
        }
        //返回XML文档的根元素节点。
        return xmlDoc.documentElement;
        }
        } else{
        //针对非IE浏览器
        if(document.implementation && document.implementation.createDocument){
        /*
        第一个参数表示XML文档使用的namespace的URL地址
        第二个参数表示要被建立的XML文档的根节点名称
        第三个参数是一个DOCTYPE类型对象，表示的是要建立的XML文档中DOCTYPE部分的定义，通常我们直接使用null
        这里我们要装载一个已有的XML文档，所以首先建立一个空文档，因此使用下面的方式
        */
        xmlDoc = document.implementation.createDocument("","",null);
        if(xmlDoc != null){
        //根据XML文档名称装载
        if(flag == true){
        //同步方式加载XML数据
        xmlDoc.async = false;
        xmlDoc.load(xml);
        } else{
        //根据表示XML文档的字符串装载
        var oParser = new DOMParser();
        xmlDoc = oParser.parseFromString(xml,"text/xml");
        }
        //返回XML文档的根元素节点。
        return xmlDoc.documentElement;
        }
        }
        }
        return null;
    };

    var internalFun = function(){
        enableEarth(false);
    };

    /**
     * 导入项目(功能入口)
     */
    var importProject = function () {
        var projectPath = earth.UserDocument.OpenFileDialog("", "项目文件(*.planPrj)|*.planPrj");    // 选择项目文件完整路径
        if (!projectPath) {
            return;
        }
        //弹出气泡窗体...
        internalFun();
        operSeqMgr = new OperSeqMgr();
        showProgressBar('开始导入...', 0, 0);
        showProgressBar('正在解压项目...', 0, 0);
            
        dataProcess.Load();
        //解压该文件
        var texttrue = projectPath.split("\\");
        var planPrj = texttrue[texttrue.length-1];
        planPrjName = planPrj.split(".")[0];
        pjPath = pjFolderLink + planPrjName;
        dataProcess.BaseFileProcess.FileUnPackage(projectPath, pjPath); 
        importCurrent++;  
        var projectGUID;
        var projectNAME;
        //"项目信息.xml"
        var proInfofile = pjPath +  "\\项目信息.xml";
        //此处的xml要采用ANSI编码 否则LoadXmlFile得到的字符串为乱码
        var configXml = earth.UserDocument.LoadXmlFile(proInfofile);
        if (configXml){
            earth.Event.OnEditDatabaseFinished = Earth_OnEditDatabaseFinished;
            var xmlDoc = top.loadXMLStr(configXml); 
            var xmlJSON = $.xml2json(xmlDoc);
            //项目ID
            projectGUID = xmlJSON.ID;
            //项目NAME 2014-4-18
            projectNAME = xmlJSON.NAME;
            if(projectGUID === "" || projectGUID === undefined){
                return;
            }
            //检查数据库中是否已经存在相同GUID的项目
            var returnPJxml = checkPeojectGUID(projectGUID);
            if( returnPJxml != ""){
                //判断是否包含有record节点 
                alert("已经包含了该项目!请删除后再进行导入操作!");
                hideProgressBar();
                enableEarth(true);
                //关闭遮罩层
                return;
            }
            //从[项目信息.xml]中获取[用地信息.xml]并解析(从中获取ID跟NAME)
            var parcelPath = xmlJSON.PARCEL.PATH;
            var veprjPath = xmlJSON.DATA.PATH;

            importCurrent = 0;
            var tobj = getImportTotal(pjPath + "\\" + veprjPath);
            importTotal = tobj.total;
            asyncTotal = tobj.async;
            importTotal += 1;
            asyncTotal += 1;
            importItem = {};

            showProgressBar('导入项目信息...');
            //投影文件 后续图层初始化时候需要用到...
            if(xmlJSON.PROJECTIONFILE){
                var spatialPath = xmlJSON.PROJECTIONFILE.PATH;
                spatialRef = dataProcess.CoordFactory.CreateSpatialRef();
                if(spatialPath){
                	spatialRefFile = pjPath + spatialPath;
                    spatialRef.InitFromFile(spatialRefFile);
                }
            }

            var parcelJSON = null;
            if(parcelPath){
                var parcelConfigXml = earth.UserDocument.LoadXmlFile(pjPath + parcelPath);
                var parcelDoc = top.loadXMLStr(parcelConfigXml);
                parcelJSON = $.xml2json(parcelDoc);
            }

            var importPJ = false;
            if(!$.isArray(parcelJSON.PARCEL)){
                parcelJSON.PARCEL = [parcelJSON.PARCEL];
            }
            for(var i = 0; i < parcelJSON.PARCEL.length; i++){
                //导入项目信息(其中包含规划用地 在用地信息.xml中) 
                importPJ = ImportProjectInfo(projectGUID, projectNAME, parcelJSON.PARCEL[i].YDNAME, parcelJSON.PARCEL[i]);
                if(!importPJ){
                    break;
                }
            }
            
            //项目信息导入成功才进行其他数据的导入
            if(importPJ){
                // 导入方案信息,方案附件,方案总平面图
                var schemePathFinally = [];
                var objTemp = {};
                var schemePath = xmlJSON.SCHEMES.PATH;
                if(!isArray(schemePath)){
                    schemePathFinally = [pjFolderLink + planPrjName +  schemePath];
                }else{
                    for(var h = 0; h < schemePath.length; h++){
                        var schItem = schemePath[h];
                        if(objTemp[schItem]){
                             continue;
                        }else{
                            schemePathFinally.push(pjFolderLink + planPrjName  + schemePath[h]);
                            objTemp[schItem] = h;
                        }
                    }
                }
                ImportScheme(pjFolderLink, schemePathFinally, projectGUID, projectNAME);

                // 导入道路红线
                var roadLinePath = xmlJSON.ROADLINE.PATH;
                if(roadLinePath){
                    ImportRoadRedLineInfo(pjFolderLink, pjFolderLink + planPrjName + roadLinePath, projectGUID);
                }

                // 导入项目附件
                var projectPath = xmlJSON.ATTACHMENTS.PATH;
                if(projectPath){
                    if(!isArray(projectPath)){
                        projectPath = [pjPath + projectPath];
                    }else{
                        for(var h = 0; h < projectPath.length; h++){
                            projectPath[h] = pjPath + projectPath[h];
                        }
                    }
                    ImportAttachments(projectPath, projectGUID, false);
                }else if(projectPath == xmlJSON.ATTACHMENTS){
                    var pa = pjPath + '\\' + xmlJSON.ATTACHMENTS;
                    pa = earth.UserDocument.LoadXmlFile(pa);
                    try{
                        pa = loadXMLStr(pa);
                        pa = $.xml2json(pa);
                        if(pa){
                            var ap = [];
                            for(var i in pa){
                                var tp = pa[i].PATH;
                                if(!$.isArray(tp)){
                                    tp = [tp];
                                }
                                for(var j = 0;j < tp.length;j++){
                                    ap.push(pjPath + tp[j]);
                                }
                            }
                            ImportAttachments(ap, projectGUID, false);
                        }
                    }catch(e){

                    }
                }
                
                importCurrent++;
                // 导入方案空间数据，即解析.veprj文件 需要在回调函数里处理 TODO:
                var veprjPath = pjPath + "\\" + veprjPath;
                ImportSpatialData(projectGUID, planPrjName, veprjPath, pjFolderLink);
            }
        }
    };

    var isArray = function(obj) { 
        return Object.prototype.toString.call(obj) === '[object Array]'; 
    }; 

    /**
     * 导入项目空间数据,解析
     * @return 
     */
    var ImportSpatialData = function(projectGuid, planPrjName, veprjPath, pjFolderLink){
        showProgressBar('导入空间数据...');
        var veprjConfigXml = earth.UserDocument.LoadXmlFile(veprjPath);
        //解析xml
        var xmlDoc = top.loadXMLStr(veprjConfigXml);
        var xmlJSON = $.xml2json(xmlDoc);
        var coordinateOffset = xmlJSON.VEProject.CoordinateOffset;
        var offsetx = coordinateOffset.OffsetX;
        var offsety = coordinateOffset.OffsetY;
        var vec2 = earth.Factory.CreateVector2();
        vec2.X = offsetx;
        vec2.Y = offsety;
        vec2.X = 0;
        vec2.Y = 0;
        m_projectOffsetList.item(projectGuid) = vec2;
        //获取方案节点
        var scheme = xmlJSON.VEProject.VEScheme;
        if(scheme.length === undefined){
            scheme = [scheme];
        }
        ImportEachScheme(scheme, xmlJSON, projectGuid, planPrjName, veprjPath, pjFolderLink);
    };
    /**
     * [ImportEachScheme description]
     * @param {[Array]}  scheme       [方案名称]
     * @param {[Obj]}    xmlJSON      [xml数据]
     * @param {[String]} projectGuid  [项目ID]
     * @param {[String]} planPrjName  [项目名称]
     * @param {[String]} veprjPath    [.veprj文件路径]
     * @param {[String]} pjFolderLink [项目文件夹路径]
     */
    var ImportEachScheme = function(scheme, xmlJSON, projectGuid, planPrjName, veprjPath, pjFolderLink){
        for(var k = 0; k < scheme.length;k++){
            var schemeGuid = scheme[k].id;
            var veGroup = scheme[k].VEGroup;//只有一个group,需要放在数组中
            var groupNum = veGroup.length;
            //项目名称
            var projectName = xmlJSON.VEProject.name;
            //方案名称
            var schemeName = scheme[k].name;
            var layerIDs = [];
            var PlanLayerIds = {};
            var ydNameArr = [];
            for(var i = 0; i < groupNum; i++){
                var group = veGroup[i];
                var groupID = group.id;
                var groupNAME = group.name;
                var type;
                var layerName;
                switch(groupNAME){
                    case  "建筑模型":
                        var veLand = group.VELand;
                        if(!$.isArray(veLand)){
                            veLand = [veLand];
                        }
                        for(var j = 0; j < veLand.length; j++){
                            var veLandObj = veLand[j];
                            ydNameArr.push(veLandObj.name);
                            if(veLandObj && veLandObj.VEBuildingSet){
                                if(!$.isArray(veLandObj.VEBuildingSet)){
                                    group = [veLandObj.VEBuildingSet];
                                }else{
                                    group = veLandObj.VEBuildingSet;
                                }
                                PlanLayerIds[veLandObj.name] = [];
                                groupID = veLandObj.id;
                                type = 1;
                                layerName = projectName + "_" + schemeName + "_" + "buildingsmodel_" + veLandObj.name;
                                var meshDic = pjFolderLink + planPrjName + "\\" + schemeName + "\\建筑模型\\" + veLandObj.name;
                                AddLayer(projectGuid, groupID, layerName, type, group, meshDic, PlanLayerIds[veLandObj.name]);

                                type = 5;
                                layerName = projectName + "_" + schemeName + "_" + "buildingspolygon_" + veLandObj.name;
                                group = veLandObj;
                                groupID = veLandObj.VEBuildShp.id;
                                var meshDic = pjFolderLink + planPrjName + "\\" + schemeName + "\\建筑模型\\" + veLandObj.name;
                                AddLayer(projectGuid, groupID, layerName, type, group, meshDic, PlanLayerIds[veLandObj.name], schemeGuid);    
                            }
                        }
                        continue;
                        break;
                    case "地面模型":
                        type = 11;
                        layerName = projectName + "_" + schemeName + "_" + "groundmodel";
                        break;
                    case "树":
                        type = 2;
                        layerName = projectName + "_" + schemeName + "_" + "billboard";
                        break;
                    case "小品":
                        type = 3;
                        layerName = projectName + "_" + schemeName + "_" + "matchmodel";
                        break;
                }
                var meshDic = pjFolderLink + planPrjName + "\\" + schemeName + "\\" + groupNAME;
                AddLayer(projectGuid, groupID, layerName, type, group, meshDic, layerIDs);
            }

            var ids = "";
            for(var j = 0; j < layerIDs.length; j++){
                var temp = layerIDs[j] + ",";
                if( j === layerIDs.length - 1){
                    ids += layerIDs[j];
                }else{
                    ids += temp;
                }
            }

            //修改为分多块用地更新，每块用地的方案指标及方案的图层都不一样
            for(var j = 0; j < ydNameArr.length; j++){
                var updateIds = ids;
                if(PlanLayerIds[ydNameArr[j]]){
                    if(updateIds == ""){
                        for(var k = 0; k < PlanLayerIds[ydNameArr[j]].length; k++){
                            if(k == PlanLayerIds[ydNameArr[j]].length - 1){
                                updateIds += PlanLayerIds[ydNameArr[j]][k];    
                            }else{
                                updateIds += PlanLayerIds[ydNameArr[j]][k] + ",";
                            }
                        }
                    }else{
                        for(var l = 0; l < PlanLayerIds[ydNameArr[j]].length; l++){
                            updateIds += "," + PlanLayerIds[ydNameArr[j]][l];
                        }
                    }  
                }
                
                Update("CPPLAN", schemeGuid, "LAYERIDS", updateIds, ydNameArr[j]);
            }
        }

        // 导入道路红线
        var redLineNode = xmlJSON.VEProject.VERoadRedLine;
        if(redLineNode){
            var roadLayerGuid = redLineNode.id;
            var roadLayerName = projectName + "_" + "roadredline";
            AddLayer2(projectGuid, roadLayerGuid, roadLayerName, 4, redLineNode);
            Update("CPPROJECT", projectGuid, "ROADLINELAYERID", roadLayerGuid);
        }
        
        // 导入规划用地
        var plotPlanNode = xmlJSON.VEProject.VEPlotPlan;
        if(plotPlanNode){
            var plotPlanGuid = plotPlanNode.id;
            var plotPlanName = projectName + "_" + "parcel";
            AddLayer2(projectGuid, plotPlanGuid, plotPlanName, 5, plotPlanNode);
            Update("CPPROJECT", projectGuid, "PARCELLAYERID", plotPlanGuid);
        }
        
        // 导入地形平整
        var smoothLineNode = xmlJSON.VEProject.VESmoothLine;
        if(smoothLineNode){
            var smoothLineGuid = smoothLineNode.id;
            var smoothLineName = projectName + "_" + "smoothline";
            AddLayer2(projectGuid, smoothLineGuid, smoothLineName, 5, smoothLineNode);
            Update("CPPROJECT", projectGuid, "SMOOTHLAYERID", smoothLineGuid);
        }
    };

    var AddLayer2 = function(projectGuid, guid, name, type, node){
        //TODO:注意layerIDS变量的作用域范围......
        var layerIDs = [];
        AddLayer(projectGuid, guid, name, type, node, "", layerIDs);
    };

    /**
     * 更新数据库中表数据(添加图层之后执行)
     * 2014.1.10
     */
    var Update = function(tableName, id, fieldName, value, ydName){
        var xml = 
            "<" + tableName +">"+
            "<CONDITION>"+
            "<ID> ='" + id + "' </ID>"  + (ydName?("<YDNAME> ='" + ydName + "' </YDNAME>"):"") +
            "</CONDITION>"+
            "<CONTENT>"+
            "<" + fieldName +">" + value + "</" + fieldName +">" +
            "</CONTENT>"+
            "</" + tableName +">";

        $.ajaxSetup({
            async: false
        });
        $.post(STAMP_config.service.update, xml, function (data) {
            if (/true/.test(data)) {
                result = true;
            }
        },"text");
    };
    /**
     * 更新附件
     */
    var UpdateAttachment = function(tableName, fieldName1, value1, fieldName2, value2){
        var xml = 
            "<" + tableName +">"+
            "<CONDITION>"+
            "<" + fieldName1 +">='" + value1 + "'</" + fieldName1 +">" +
            "</CONDITION>"+
            "<CONTENT>"+
            "<" + fieldName2 +">" + value2 + "</" + fieldName2 +">" +
            "</CONTENT>"+
            "</" + tableName +">";

        $.ajaxSetup({
            async: false
        });
        $.post(STAMP_config.service.update, xml, function (data) {
              if (/true/.test(data)) {
                result = true;
            }
        },"text");
    };

    var AddLayer = function(projectGuid, groupID, layerName, type, group, meshDic, layerIDs, schemeGuid){
        var datum = dataProcess.CoordFactory.CreateDatum();
        if(spatialRef){
            datum.Init(spatialRef);
        }
        
        var importParam = {
            guid:groupID,
            name:layerName,
            type:type,
            node:group,
            ProjectGuid:projectGuid,
            Datum:datum,
            MeshDic:meshDic,
            SpatialRef:spatialRefFile,
            schemeGuid: schemeGuid
        };

        m_importLayerParams.item(groupID) = importParam;

        importItem[groupID] = {
            id: groupID,
            name: layerName
        };

        var param = earth.Factory.CreateLayerParameter();
        param.Guid = groupID;
        param.Name = layerName;
        param.Type = type;
        param.Status = 1;
        // -2表示图层是规划项目(即方案、规划用地和道路红线等图层)相关的;-1表示是编辑平台添加的图层；-3表示用地现状相关的，但也需要从编辑平台中添加
        earth.DatabaseManager.AddLayerInDatabaseIncludeGroupID(STAMP_config.server.dataServerIP,param, -2);
        layerIDs.push(groupID);
    };

    /**
     * 导入道路红线
     * @param  {[type]} folderPath   [description]
     * @param  {[type]} roadLinePath [description]
     * @param  {[type]} projectGuid  [description]
     * @return {[type]}              [description]
     */
    var ImportRoadRedLineInfo = function(folderPath, roadLinePath, projectGuid){
        var roadLineConfigXml = earth.UserDocument.LoadXmlFile(roadLinePath);
        var xmlDoc = top.loadXMLStr(roadLineConfigXml);
        var xmlJSON = $.xml2json(xmlDoc);
        if(!xmlJSON){
            return;
        }
        var roadLineID = xmlJSON.ROAD;
        if(roadLineID.length === undefined){
            roadLineID = [roadLineID];
        }
        importRoadRedLineTemp(roadLineID, projectGuid);
    };

    var importRoadRedLineTemp = function(roadLineID, projectGuid){
        for(var i = 0; i < roadLineID.length; i++){
            var roadLineNAME = roadLineID[i].NAME;
            var roadLineDistance = roadLineID[i].TXJL;
            var roadID = roadLineID[i].ID;
            var xml = 
                "<CPROADLINE>"+
                "<ID>" + roadID + "</ID>" +
                "<PROJECTID>" + projectGuid + "</PROJECTID>" + 
                "<CODE>" + roadLineNAME + "</CODE>" + 
                "<TYPE />" + 
                "<DISTANCE>" + roadLineDistance + "</DISTANCE> " +
                "</CPROADLINE>";

            $.ajaxSetup({
                async: false
            });
            $.post(STAMP_config.service.add, xml, function (data) {
                if (/true/.test(data)) {
                    result = true;
                }
            },"text");
        }
    };

    /**
     * 从数据库中获取项目的guid
     */
    var checkPeojectGUID= function (GUID){
        var roadQueryXml =
            '<QUERY><CONDITION><AND>' +
                '<ID tablename="CPPROJECT">=\'' + GUID + '\'</ID>' +
                '</AND></CONDITION>' +
                '<RESULT><CPPROJECT/></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, roadQueryXml);
    };

    /**
     * 导入项目信息 导入成功则返回true
     * 2014.4.21
     */
    var ImportProjectInfo = function (projectGUID, projectNAME, parcelNAME, parcelJSON){
        var myDate = new Date();  
        var tempMonth = myDate.getMonth()+1;
        var currentMonth = (tempMonth< 10)?("0"+tempMonth):tempMonth;
        var tempDate = myDate.getDate();
        var currentData = (tempDate< 10)?("0"+tempDate):tempDate;
        var projectTime = myDate.getFullYear()  + "" + currentMonth + "" +  currentData;
        var result = false;
        var xml = 
            "<CPPROJECT>" + 
                "<ID>" + projectGUID + "</ID>" +
                "<NAME>" + projectNAME + "</NAME>" +
                "<YDNAME>" + parcelNAME + "</YDNAME>" +
                "<YDXZ>" + ((parcelJSON && parcelJSON.YDXZ) ? parcelJSON.YDXZ : "") +"</YDXZ>" +
                "<STAGE>4</STAGE>" + 
                "<QSDW>" + ((parcelJSON && parcelJSON.QSDW) ? parcelJSON.QSDW : "") +"</QSDW>"+
                "<PROJDATE>"+ projectTime +"</PROJDATE>"+
                "<STATUS>0</STATUS>"+
                "<ISLOAD>0</ISLOAD><PARCELLAYERID></PARCELLAYERID><ROADLINELAYERID></ROADLINELAYERID><SMOOTHLAYERID></SMOOTHLAYERID><DISTRICT></DISTRICT>"+
                "<YDMJ>" + ((parcelJSON && parcelJSON.YDMJ) ? parcelJSON.YDMJ : "") +"</YDMJ>"+
                "<JZMD>" + ((parcelJSON && parcelJSON.JZMD) ? parcelJSON.JZMD : "") +"</JZMD>"+
                "<RJL>" + ((parcelJSON && parcelJSON.RJL) ? parcelJSON.RJL : "") +"</RJL>"+
                "<LDL>" + ((parcelJSON && parcelJSON.LDL) ? parcelJSON.LDL : "") +"</LDL>"+
                "<JZXG>" + ((parcelJSON && parcelJSON.JZXG) ? parcelJSON.JZXG : "") +"</JZXG>"+
                "<BZ>" + ((parcelJSON && parcelJSON.BZ) ? parcelJSON.BZ : "") +"</BZ>" + 
            "</CPPROJECT>";
        $.ajax({
            url:STAMP_config.service.add,
            type:"post",
            data:xml,
            async:false,
            dataType:"text",
            success:function(jdata){
                if (/true/.test(jdata)) {
                    result = true;
                }
            },
            error:function(errMsg, msg){
                alert("请检查IE安全选项中\"跨域浏览窗口和框架\"和\"通过域访问数据源\"是否已设置为允许？");
            }
        });
        return result;
    };

    /**
     * 导入方案信息和方案附件
     */
    var ImportScheme = function (folderPath, schemePath, projectGuid, projectNAME){
        for(var i = 0; i < schemePath.length; i++){
            var result = false;
            var schemeConfigXml = earth.UserDocument.LoadXmlFile(schemePath[i]);
            if(schemeConfigXml){
                var xmlDoc = top.loadXMLStr(schemeConfigXml); 
                var parcelJSON = $.xml2json(xmlDoc);
                var planInfo = parcelJSON.PLAN;
                var totalFile = parcelJSON.TOTALFLATFIGURE.PATH;//总平面图
                var planAttachments = parcelJSON.ATTACHMENTS.PATH;//方案附件
                if(planAttachments){
                    if(!isArray(planAttachments)){
                        planAttachments = [pjFolderLink + planPrjName  + planAttachments];
                    }else{
                        for(var h = 0; h < planAttachments.length; h++){
                            planAttachments[h] = pjFolderLink + planPrjName  + planAttachments[h];
                        }
                    }
                }else if(planAttachments == parcelJSON.ATTACHMENTS){
                    var pa = pjPath + '\\' + planNAME + '\\' + parcelJSON.ATTACHMENTS;
                    pa = earth.UserDocument.LoadXmlFile(pa);
                    pa = $.xml2json(pa);
                    if(pa){
                        planAttachments = [];
                        for(var k in pa){
                            var tp = pa[k].PATH;
                            if(!$.isArray(tp)){
                                tp = [tp];
                            }
                            for(var j = 0;j < tp.length;j++){
                                planAttachments.push(pjPath + '\\' + planNAME + tp[j]);
                            }
                        }
                    }
                }
                if(!$.isArray(planInfo)){
                    planInfo = [planInfo];
                }
                for(var j = 0; j < planInfo.length; j++){
                    var xml = 
                        "<CPPLAN>"+
                        "<ID>" + planInfo[j].ID + "</ID>" + 
                        "<YDNAME>" + planInfo[j].ydmc + "</YDNAME>" + 
                        "<PROJECTID>" + projectGuid + "</PROJECTID>" + 
                        "<LAYERIDS />" + 
                        "<NAME>" + planInfo[j].NAME + "</NAME>" +
                        "<TYPE>4</TYPE><SJDW />"+
                        "<GHZYD>" +  (planInfo[j].GHZYD?planInfo[j].GHZYD:"") +"</GHZYD>"+
                        "<GHJYD>" +  (planInfo[j].GHJYD?planInfo[j].GHJYD:"") +"</GHJYD>"+
                        "<ZZYD>" +  (planInfo[j].ZZYD?planInfo[j].ZZYD:"") +"</ZZYD>"+
                        "<GJYD>" +  (planInfo[j].GJYD?planInfo[j].GJYD:"") +"</GJYD>"+
                        "<DLYD>" +  (planInfo[j].DLYD?planInfo[j].DLYD:"") +"</DLYD>"+
                        "<GGLD>" +  (planInfo[j].GGLD?planInfo[j].GGLD:"") +"</GGLD>"+
                        "<ZJZMJ>" +  (planInfo[j].ZJZMJ?planInfo[j].ZJZMJ:"") +"</ZJZMJ>"+
                        "<DSJZMJ>" +  (planInfo[j].DSJZMJ?planInfo[j].DSJZMJ:"") +"</DSJZMJ>"+
                        "<ZZJZMJ>" +  (planInfo[j].ZZJZMJ?planInfo[j].ZZJZMJ:"") +"</ZZJZMJ>"+
                        "<SYJZMJ>" +  (planInfo[j].SYJZMJ?planInfo[j].SYJZMJ:"") +"</SYJZMJ>"+
                        "<YEYJZMJ>" +  (planInfo[j].YEYJZMJ?planInfo[j].YEYJZMJ:"") +"</YEYJZMJ>"+
                        "<SQFWZXJZMJ>" +  (planInfo[j].SQFWZXJZMJ?planInfo[j].SQFWZXJZMJ:"") +"</SQFWZXJZMJ>"+
                        "<DXJZMJ>" +  (planInfo[j].DXJZMJ?planInfo[j].DXJZMJ:"") +"</DXJZMJ>"+
                        "<DXSYMJ>" +  (planInfo[j].DXSYMJ?planInfo[j].DXSYMJ:"") +"</DXSYMJ>"+
                        "<DXTCCMJ>" +  (planInfo[j].DXTCCMJ?planInfo[j].DXTCCMJ:"") +"</DXTCCMJ>"+
                        "<DXQTMJ>" +  (planInfo[j].DXQTMJ?planInfo[j].DXQTMJ:"") +"</DXQTMJ>"+
                        "<RJL>" +  (planInfo[j].RJL?planInfo[j].RJL:"") +"</RJL>"+
                        "<DSRJL>" +  (planInfo[j].DSRJL?planInfo[j].DSRJL:"") +"</DSRJL>"+
                        "<DXRJL>" +  (planInfo[j].DXRJL?planInfo[j].DXRJL:"") +"</DXRJL>"+
                        "<JZMD>" +  (planInfo[j].JZMD?planInfo[j].JZMD:"") +"</JZMD>"+
                        "<LDL>" +  (planInfo[j].LDL?planInfo[j].LDL:"") +"</LDL>"+
                        "<GHHS>" +  (planInfo[j].GHHS?planInfo[j].GHHS:"") +"</GHHS>"+
                        "<HJRK>" +  (planInfo[j].HJRK?planInfo[j].HJRK:"") +"</HJRK>"+
                        "<GHRS>" +  (planInfo[j].GHRS?planInfo[j].GHRS:"") +"</GHRS>"+
                        "<ZTCW>" +  (planInfo[j].ZTCW?planInfo[j].ZTCW:"") +"</ZTCW>"+
                        "<DSTCW>" +  (planInfo[j].DSTCW?planInfo[j].DSTCW:"") +"</DSTCW>"+
                        "<DXTCW>" +  (planInfo[j].DXTCW?planInfo[j].DXTCW:"") +"</DXTCW>"+
                        "<DMTCL>" +  (planInfo[j].DMTCL?planInfo[j].DMTCL:"") +"</DMTCL>" +
                        "<BZ /></CPPLAN>";

                    $.ajaxSetup({
                        async: false
                    });
                    result = false;
                    $.post(STAMP_config.service.add, xml, function (data) {
                         if (/true/.test(data)) {
                            result = true;
                        }
                    },"text");
                    if(!result){
                        break;
                    }
                }
                
                //当方案信息导入成功后 再导入其他信息
                if(result){
                    //导入建筑信息
                    var buildingPaths = parcelJSON.BUILDINGS.PATH;
                    if(buildingPaths){
                        if(!$.isArray(buildingPaths)){
                            buildingPaths = [buildingPaths];
                        }
                        for(var k = 0; k < buildingPaths.length; k++){
                            if(!buildingPaths[k]){
                                continue;
                            }
                            var buildingPathsArr = buildingPaths[k].split("\\建筑模型\\");
                            if(buildingPathsArr.length >= 2){
                               var ydName = buildingPathsArr[1].substring(0, buildingPathsArr[1].indexOf("\\建筑信息.xml")); 
                            }
                            ImportBuildingsInfo(folderPath + planPrjName + buildingPaths[k], projectGuid, planInfo[0].ID, totalFile, planInfo[0].NAME, ydName);
                        }
                    }
                    
                    //导入方案附件
                    if (planAttachments) {
                        ImportAttachments(planAttachments, planInfo[0].ID, false);
                    };
                }
            }
        }
    };

    /*导入矢量面xml*/
    var ImportBuildingShp = function(path,planId){
        var buildingShpXml = earth.UserDocument.LoadXmlFile(path);
        var xmlDoc = top.loadXMLStr(buildingShpXml);
        var xmlJSON = $.xml2json(xmlDoc);
        if(!xmlJSON){
            return;
        }
        if(xmlJSON.Polygon){
            if(!$.isArray(xmlJSON.Polygon)){
                xmlJSON.Polygon = [xmlJSON.Polygon];
            }
            for(var i=0; i<xmlJSON.Polygon.length; i++){
                var xml = "<BUILDINGSHP>"
                xml += "<PLANID>"+planId+"</PLANID>";
                var thisPolygon = xmlJSON.Polygon[i];
                xml += "<ID>" + (thisPolygon.ID ? thisPolygon.ID:"") + "</ID>"
                xml += "<NAME>" + (thisPolygon.Name ? thisPolygon.Name:"") +"</NAME>";
                xml += "</BUILDINGSHP>"
                $.ajaxSetup({
                    async: false
                });
                $.post(STAMP_config.service.add, xml, function (data) {
                     if (/true/.test(data)) {
                        result = true;
                    }
                },"text");
            }
        }
    }

    /**
     * 导入建筑信息.xml
     */
    var ImportBuildingsInfo= function (BuildingPath, projectGuid, planID, totalFile, planName, ydName){
        var buildingConfigXml = earth.UserDocument.LoadXmlFile(BuildingPath);
        //将xmlStr转换为dom对象
        var xmlDoc = top.loadXMLStr(buildingConfigXml); 
        var xmlJSON = $.xml2json(xmlDoc);
        if(!$.isArray(xmlJSON.BUILDING)){
            //仅有一个建筑
            xmlJSON.BUILDING = [xmlJSON.BUILDING];
        }
        var buildNum = xmlJSON.BUILDING.length;
        //遍历每一个建筑节点
        for(var i = 0; i < buildNum; i++){
            var result = false;
            var buildNode = xmlJSON.BUILDING[i];
            var buildingID = buildNode.ID;
            var buildingNAME = buildNode.NAME;
            var xml = 
                "<CPBUILDING>"
                + "<ID>" + buildingID + "</ID>"
                + "<YDNAME>" + ydName + "</YDNAME>"
                + "<PLANID>" + planID + "</PLANID>"
                + "<NAME>" + buildingNAME + "</NAME>"
                + "<JZXZ>" + (buildNode.JZXZ && buildNode.JZXZ.text?buildNode.JZXZ.text:0) + "</JZXZ>"
                + "<JZJDMJ>" + (buildNode.JZJDMJ && buildNode.JZJDMJ.text?buildNode.JZJDMJ.text:0) 
                + "</JZJDMJ><ZJZMJ>" +  (buildNode.ZJZMJ && buildNode.ZJZMJ.text?buildNode.ZJZMJ.text:0) 
                + "</ZJZMJ><DSJZMJ>" + (buildNode.DSJZMJ && buildNode.DSJZMJ.text?buildNode.DSJZMJ.text:0) 
                + "</DSJZMJ><ZZJZMJ>" + (buildNode.ZZJZMJ && buildNode.ZZJZMJ.text?buildNode.ZZJZMJ.text:0) 
                + "</ZZJZMJ><SYJZMJ>" + (buildNode.SYJZMJ && buildNode.SYJZMJ.text?buildNode.SYJZMJ.text:0) 
                + "</SYJZMJ><YEYJZMJ>" + (buildNode.YEYJZMJ && buildNode.YEYJZMJ.text?buildNode.YEYJZMJ.text:0) 
                + "</YEYJZMJ><SQFWZXJZMJ>" + (buildNode.SQFWZXJZMJ && buildNode.SQFWZXJZMJ.text?buildNode.SQFWZXJZMJ.text:0)
                + "</SQFWZXJZMJ><DXJZMJ>" + (buildNode.DXJZMJ && buildNode.DXJZMJ.text?buildNode.DXJZMJ.text:0) 
                + "</DXJZMJ><DXSYMJ>" + (buildNode.DXSYMJ && buildNode.DXSYMJ.text?buildNode.DXSYMJ.text:0) 
                + "</DXSYMJ><DXTCCMJ>" +  (buildNode.DXTCCMJ && buildNode.DXTCCMJ.text?buildNode.DXTCCMJ.text:0) 
                + "</DXTCCMJ><DXQTMJ>" + (buildNode.DXQTMJ && buildNode.DXQTMJ.text?buildNode.DXQTMJ.text:0) 
                + "</DXQTMJ><JZGD>" + (buildNode.JZGD && buildNode.JZGD.text?buildNode.JZGD.text:0) 
                + "</JZGD><JZCS>" +  (buildNode.JZCS && buildNode.JZCS.text?buildNode.JZCS.text:0) 
                + "</JZCS><DSCS>" + (buildNode.DSCS && buildNode.DSCS.text?buildNode.DSCS.text:0) 
                + "</DSCS><DXCS>" + (buildNode.DXCS && buildNode.DXCS.text?buildNode.DXCS.text:0) 
                + "</DXCS><GHHS>" + (buildNode.GHHS && buildNode.GHHS.text?buildNode.GHHS.text:0) 
                + "</GHHS><HJRK>" + (buildNode.HJRK && buildNode.HJRK.text?buildNode.HJRK.text:0) 
                + "</HJRK><GHRS>" + (buildNode.GHRS && buildNode.GHRS.text?buildNode.GHRS.text:0) 
                + "</GHRS><ZTCW>" +  (buildNode.ZTCW && buildNode.ZTCW.text?buildNode.ZTCW.text:0) 
                + "</ZTCW><DSTCW>" + (buildNode.DSTCW && buildNode.DSTCW.text?buildNode.DSTCW.text:0) 
                + "</DSTCW><DXTCW>" + (buildNode.DXTCW && buildNode.DXTCW.text?buildNode.DXTCW.text:0) 
                + "</DXTCW></CPBUILDING>";
            $.ajaxSetup({
                async: false
            });
            $.post(STAMP_config.service.add, xml, function (data) {
                 if (/true/.test(data)) {
                    result = true;
                }
            },"text");

            var bPathStr = BuildingPath.substring(0, BuildingPath.lastIndexOf("\\"));
            //建筑附件
            var attachmentAry = buildNode.ATTACHMENTS.PATH;
            if(attachmentAry){
                if(!isArray(attachmentAry)){
                    attachmentAry = [bPathStr + "\\" +  attachmentAry];
                }else{
                    for(var k = 0; k < attachmentAry.length; k++){
                        attachmentAry[k] = bPathStr + "\\" + attachmentAry[k];
                    }
                }
                ImportAttachments(attachmentAry, buildingID, false);
            }else if(attachmentAry == buildNode.ATTACHMENTS){
                var pa = pjPath + '\\' + buildNode.ATTACHMENTS;
                pa = earth.UserDocument.LoadXmlFile(pa);
                pa = $.xml2json(pa);
                if(pa){
                    attachmentAry = [];
                    for(var i in pa){
                        var tp = pa[i].PATH;
                        if(!$.isArray(tp)){
                            tp = [tp];
                        }
                        for(var j = 0;j < tp.length;j++){
                            var tp2 = pjPath + '\\' + planName + '\\建筑模型\\' + buildingNAME + tp[j];
                            attachmentAry.push(tp2);
                        }
                    }
                    ImportAttachments(attachmentAry, buildingID, false);
                }
            }
        }
        //导入总平图
        if(totalFile){
            if(!isArray(totalFile)){
                totalFile = [pjPath + "\\" + totalFile];
            }else{
                if(attachmentAry){
                    if(!$.isArray(attachmentAry)){
                        attachmentAry = [attachmentAry];
                    }
                    for(var p = 0; p < attachmentAry.length; p++){
                        attachmentAry[p] = pjPath + "\\" + attachmentAry[p];
                    }
                }
            }
            ImportAttachments(totalFile, planID, true);
        }
    };

    /**
     * todo:导入附属物 如:<PATH>mesh_xyhf1_jz01.USB\建筑附件\xyhf_gh01_211005_1_08.jpg</PATH>
     */
    var ImportAttachments = function (attachmentAry, buildingID, isTotalPlatPicture){
        for(var i = 0; i < attachmentAry.length; i++){
            var path = attachmentAry[i];
            var pathStrAry = path.split("\\");
            var pathName = pathStrAry[pathStrAry.length - 1];
            var type = pathName.split(".")[1];
            var id = earth.Factory.CreateGUID();
            //获取name
            var name;
            if (isTotalPlatPicture){
                name = buildingID;
            }else{
                name = pathName.split(".")[0];
            }
            var xml = 
            "<CPATTACHMENT>"+
            "<ID>" + id + "</ID>" +
            "<PLANID>" + buildingID + "</PLANID>" + 
            "<NAME>" + name + "</NAME>" + 
            "<TYPE>" + type + "</TYPE>"+
            "</CPATTACHMENT>";
            var result = false;
            $.ajaxSetup({
                async: false
            });
            $.post(STAMP_config.service.add, xml, function (data) {
                if (/true/.test(data)) {
                    result = true;
                }
            },"text");
            //导入图片二进制数据
            if(result){
                //这里要区分txt与图片
                earth.DatabaseManager.PostFile(path, STAMP_config.service.addAttachmentObj + id);
            }
        }
    };

// region 项目导入
    var resolvePositions = function(node, offset){
        var result = earth.Factory.CreateVector3s();
        if (node != null)
        {
            var postions = node["Position"];
            var posNum = postions.length?postions.length:1;
            for (var i = 0; i < posNum; i++)
            {
                var node = postions[i]?postions[i]:postions;
                var x = Number(node.X);
                var y = Number(node.Y);
                var z = Number(node.Z);

                result.Add(x, y, z);
            }
        }
        return result;
    };

    // 坐标转换
    var src_xy_to_des_BLH = function(vect3, datum)
    {
        var result = earth.Factory.CreateVector3();
        var sePoint = datum.src_xy_to_des_BLH(vect3.X, vect3.Z, vect3.Y);// .veprj文件中y和z是互换了
        result.X = sePoint.X;
        result.Y = sePoint.Y;
        result.Z = vect3.Y;
        return result;
    };

     // 坐标转换
    var src_xy_to_des_BLH2 = function(vect3s, datum){
        var result = earth.Factory.CreateVector3s();
        for (var i = 0; i < vect3s.Count; i++)
        {
            var vect3 = vect3s.Items(i);
            var sePoint = datum.src_xy_to_des_BLH(vect3.X, vect3.Z, vect3.Y);// .veprj文件中y和z是互换了
            var altitude = earth.Measure.MeasureTerrainAltitude(sePoint.X, sePoint.Y);
            result.Add(sePoint.X, sePoint.Y, altitude);
        }
        return result;
    };
    // 创建StyleInfo对象
    var CreateEDbEleInfo = function(objGuid, objName, layerType, vects, lineWidth, lineColor, fillColor){
        var info;
        if(objGuid && vects.length > 0){
            info = earth.Factory.CreateDbEleInfo(objGuid, objName);
            var styleinfo = earth.Factory.CreateStyleInfo();
            var stylelist = earth.Factory.CreateStyleInfoList();
            
            styleinfo.LineWidth = lineWidth;
            styleinfo.FirstColor = lineColor;
            if (layerType != 4)
            {
                styleinfo.SecondColor = fillColor;
            }
            stylelist.AddItem(styleinfo);

            info.DrawOrder = 1000;
            info.Type = layerType;
            info.StyleInfoList = stylelist;
            info.SphericalVectors.Add(vects);
            info.AltitudeType = 1;
        }
        return info;
    };

    /**
     * 导入规划用地或地形平整
     */
    var _savePolygonObject = function (param) {
        var stylelist = earth.Factory.CreateStyleInfoList();
        var infolist = earth.Factory.CreateDbEleInfoList();
        var offset = m_projectOffsetList.item(param.ProjectGuid);
        var nodes = param.node;
        var nodeNum = nodes.length?nodes.length:1;
        for(var i = 0; i < nodeNum; i++){
            var node = nodes[i]?nodes[i]:nodes;
            var id = node.id;
            if(node["VEPlotPlan"]){//规划用地
                var planNodes = node["VEPlotPlan"];
                var planNum = planNodes.length?planNodes.length:1;
                for(var p = 0; p < planNum; p++){
                    var childrenNode = planNodes[p]?planNodes[p]:planNodes;
                    id = childrenNode.id;
                    var name = childrenNode.name;
                    var vct3s = resolvePositions(childrenNode, offset);
                    var vects = src_xy_to_des_BLH2(vct3s, param.Datum);
                    if (vects.Count > 0){
                        var info = CreateEDbEleInfo(id, name, 5, vects, 1, 0xccffff00, 0x0000ff00);
                        if (info != null){
                            infolist.AddItem(info);
                        }
                    }
                }
            }else if (node["VESmoothLine"]){//地形平整
                var planNodes = node["VESmoothLine"];
                var planNum = planNodes.length?planNodes.length:1;
                for(var p = 0; p < planNum; p++){
                    var childrenNode = planNodes[p]?planNodes[p]:planNodes;
                    var name = "smoothitem" + i.toString();
                    var vct3s = resolvePositions(childrenNode, offset);
                    var vects = src_xy_to_des_BLH2(vct3s, param.Datum);
                    if (vects.Count > 0){
                        var info = CreateEDbEleInfo(id, name, 5, vects, 1, 0xccd90c00, 0xaaffbf7f);
                        if (info != null){
                            infolist.AddItem(info);
                        }
                    }
                }
            }else if (node["VEBuildShp"]){//建筑矢量面----2017-06-05zhangd新增
                var schemeGuid = param.schemeGuid;
                var planNodes = node["VEBuildShp"]["VEBuildShp"];
                var planNum = planNodes.length?planNodes.length:1;
                for(var p = 0; p < planNum; p++){
                    var childrenNode = planNodes[p]?planNodes[p]:planNodes;
                    var thisShpId = childrenNode.id;
                    var name = childrenNode.buildname; 
                    var vct3s = resolvePositions(childrenNode, offset);
                    var vects = src_xy_to_des_BLH2(vct3s, param.Datum);
                    if (vects.Count > 0){
                        var ydName = node.name;
                        var position = getBuildingLocation(node["VEBuildingSet"], name, param.Datum);
                        var height = getBuildingHeight(schemeGuid, ydName, name);
                        var info = CreateEDbEleInfo(thisShpId, name, 5, vects, 1, 0xFFFFFFFF, 0xFFFFFFFF);//PolygonObject
                        info.Height = height;
                        if(position){
                            info.SphericalTransform.SetLocation(position);
                        }
                        if (info != null){
                            infolist.AddItem(info);
                        }
                    }
                }
            }
        }
        if(infolist.Count > 0){
            importItem[param.guid] = {
                id: param.guid,
                name: (node["VEPlotPlan"] ? '规划用地' : (node["VESmoothLine"]?'地形平整':'建筑矢量面'))
            };
            earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP,param.guid, infolist);
        }
    };

    //获取矢量面对应的建筑物模型location
    var getBuildingLocation = function(node, name, datum){
        if(node.length == undefined){
            node = [node];
        }
        var location = null;
        for(var p = 0; p < node.length; p++){
            var childNode = node[p];
            if(childNode["VEModel"].name == name){
                var obj = VEPrjObject(childNode["VEModel"]);
                var srcLct = earth.Factory.CreateVector3();
                srcLct.X = obj.Pivot.X + obj.Position.X;
                srcLct.Y = obj.Pivot.Y + obj.Position.Y;
                srcLct.Z = obj.Pivot.Z + obj.Position.Z;
                location = src_xy_to_des_BLH(srcLct, datum);
                break;
            }
        }
        return location;
    }

    //获取建筑高度
    var getBuildingHeight = function(schemeGuid, ydName, name){
        var buildingQueryXml =
                '<QUERY>' +
                '<CONDITION><AND><PLANID tablename = "CPBUILDING">=\'' + schemeGuid + '\'</PLANID><YDNAME tablename = "CPBUILDING">=\'' + ydName + '\'</YDNAME><NAME tablename = "CPBUILDING">=\'' + name + '\'</NAME></AND></CONDITION>' +
                '<RESULT><CPBUILDING></CPBUILDING></RESULT>' +
                '</QUERY>';
        var result = _queryData(STAMP_config.service.query, buildingQueryXml);
        if (result.length <= 0) {
            return 0;
        }
        return result[0]["CPBUILDING.JZGD"];
    }

    /**
     *  导入道路红线
     */
    var _savePolylineObject = function (param) {
        var stylelist = earth.Factory.CreateStyleInfoList();
        var infolist = earth.Factory.CreateDbEleInfoList();
        var offset = m_projectOffsetList.item(param.ProjectGuid);
        var nodes = param.node;
        var nodeNum = nodes.length?nodes.length:1;
        for(var i = 0; i < nodeNum; i++){
            var node = nodes[i]?nodes[i]:nodes;
            var id = node.id;
            if(node["VERoadRedLine"]){
                var planNodes = node["VERoadRedLine"];
                var planNum = planNodes.length?planNodes.length:1;
                for(var p = 0; p < planNum; p++){
                    var childrenNode = planNodes[p]?planNodes[p]:planNodes;
                    var childrenNodeId = childrenNode.id;
                    var name = "roadredline" + i.toString();
                    var vct3s = resolvePositions(childrenNode, offset);
                    var vects = src_xy_to_des_BLH2(vct3s, param.Datum);
                    if (vects.Count > 0){
                        var info = CreateEDbEleInfo(childrenNodeId, name, 4, vects, 1, 0xffff0000, 0xaaffbf7f);
                        if (info != null){
                            infolist.AddItem(info);
                        }
                    }
                }
            }
        }
        if(infolist.Count > 0){
            importItem[param.guid] = {
                id: param.guid,
                name: '道路红线'
            };
            earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP,param.guid, infolist);
        }
    };

    /**
     *  导入方案中的小品
     */
    var _saveMatchModel = function (param) {
        if (param != null && param["type"] == 3){
            var offset = m_projectOffsetList.item(param.ProjectGuid);
            var nodes = param.node;
            var nodeNum = nodes.length?nodes.length:1;
            var dic = new ActiveXObject("Scripting.Dictionary");
            for (var i = 0; i < nodeNum; i++){
                var setNode = nodes[i]?nodes[i]:nodes;
                if (nodes["VEMatchModelSet"]){
                    var models = nodes["VEMatchModelSet"];
                    var modelsNum = models.length?models.length:1;
                    for (var j = 0; j < modelsNum; j++){
                        var modelSet = models[j]?models[j]:models;
                        if(modelSet && modelSet["VEMatchModel"]){
                            modelSet = modelSet["VEMatchModel"];
                        }
                        
                        var modelNum = modelSet.length?modelSet.length:1;
                        for (var l = 0; l < modelNum; l++){
                            var modelChild = modelSet[l]?modelSet[l]:modelSet;
                            _addRecordInLayer(modelChild, param, offset, dic);
                        }
                    }
                }
            }
        }
    };

    /**
     * 导入方案中的树
     */
    var _saveBillBoard = function(param){
        if (param != null && param["type"] == 2){
            var offset = m_projectOffsetList.item(param.ProjectGuid);
            var nodes = param.node;
            var nodeNum = nodes.length?nodes.length:1;
            var dic = new ActiveXObject("Scripting.Dictionary");
            for (var i = 0; i < nodeNum; i++){
                var setNode = nodes[i]?nodes[i]:nodes;
                if (nodes["VEBillboardSet"]){
                    var models = nodes["VEBillboardSet"];
                    var modelsNum = models.length?models.length:1;
                    for (var j = 0; j < modelsNum; j++){
                        var modelSet = models[j]?models[j]["VEBillboard"]:models["VEBillboard"];
                        var mNum = modelSet.length?modelSet.length:1;
                        for (var l = 0; l < mNum; l++){
                            var matchNode = modelSet[l]?modelSet[l]:modelSet;
                            _addRecordInLayer(matchNode, param, offset, dic);
                        }
                    }
                }
            }
        }
    };

    /**
     * 导入地面模型 (.usb或.usx文件)
     * @param  {[type]} param [description]
     * @return {[type]}       [description]
     */
    var _saveGroundModelObject = function(param){
        return _saveGroundModelObject2(param);
       if (param != null && param["type"] == 11){
            var datum = param.Datum;
            var groupNode = param.InfoNode;
            var serverIP = STAMP_config.server.dataServerIP;
            var offset = m_projectOffsetList.item(param.ProjectGuid);
            var nodeNum = param.node.length? param.node.length : 1;
            for (var i = 0; i < nodeNum; i++){
                var node = param.node["VEModel"];
                if(!node){
                    return;
                }
                var nodeLen = node.length?node.length:1;
                if(nodeLen > 0){
                    var temp;
                    for(var k = 0; k < nodeLen; k++){
                        temp = node[k]?node[k]:node;
                        var obj = VEPrjObject(temp);
                        var srcLct = earth.Factory.CreateVector3();
                        srcLct.X = obj.Pivot.X + obj.Position.X;
                        srcLct.Y = obj.Pivot.Y + obj.Position.Y;
                        srcLct.Z = obj.Pivot.Z + obj.Position.Z;
                        var location = src_xy_to_des_BLH(srcLct, param.Datum);
                       
                        var guid = "";
                        var server = serverIP;
                        var filepath = param.MeshDic;
                        var filename = temp.name;
                        var modelName = temp.name;
                        var logpath = earth.RootPath + "temp";
                        var savemethod = 1;
                        var result = generateEditDll.run_single_ref_no_thread(param.guid, server, filepath, modelName, param.SpatialRef, logpath/*, savemethod*/);                    
                        importCurrent++;
                        showProgressBar('导入地面模型 ' + modelName);
                        if (result){
                            var count = generateEditDll.get_guid_count();
                            if(count <= 0){
                                continue;
                            }
                            guid = generateEditDll.get_at(count - 1);
                            if (obj.Position.X != 0 || obj.Position.Y != 0 || obj.Position.Z != 0 || 
                                obj.Rotation.X != 0 || obj.Rotation.Y != 0 || obj.Rotation.Z != 0 || 
                                obj.Scaling.X != 1 || obj.Scaling.Y != 1 || obj.Scaling.Z != 1){
                                importItem[guid] = {
                                    id: guid,
                                    name: modelName
                                };

                                var name = "model" + i;
                                var baseobj = earth.Factory.CreateDataBaseObject(guid, name);
                                baseobj.SphericalTransform.SetLocationEx(obj.Pivot.X + obj.Position.X, 
                                    obj.Pivot.Y + obj.Position.Y, 
                                    obj.Pivot.Z + obj.Position.Z);
                                baseobj.SphericalTransform.SetRotation(obj.Rotation);
                                baseobj.SphericalTransform.SetScale(obj.Scaling);
                                baseobj.BBox.SetExtent(obj.MinBoundary, obj.MaxBoundary);
                                earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,param.guid, guid, baseobj);
                            }
                        }
                    }
                }
            }
        }
    };

    var _saveGroundModelObject2 = function(param){
       if (param != null && param["type"] == 11){
            var datum = param.Datum;
            var groupNode = param.InfoNode;
            var serverIP = STAMP_config.server.dataServerIP;
            var offset = m_projectOffsetList.item(param.ProjectGuid);
            var nodeNum = param.node.length? param.node.length : 1;
            var fns = [];
            for (var i = 0; i < nodeNum; i++){
                var node = param.node["VEModel"];
                if(!node){
                    return;
                }
                var nodeLen = node.length ? node.length : 1;
                if(nodeLen > 0){
                    var temp;
                    for(var k = 0; k < nodeLen; k++){
                        temp = node[k]?node[k]:node;
                        var obj = VEPrjObject(temp);
                        var srcLct = earth.Factory.CreateVector3();
                        srcLct.X = obj.Pivot.X + obj.Position.X;
                        srcLct.Y = obj.Pivot.Y + obj.Position.Y;
                        srcLct.Z = obj.Pivot.Z + obj.Position.Z;
                        var location = src_xy_to_des_BLH(srcLct, param.Datum);
                       
                        var guid = "";
                        var server = serverIP;
                        var filepath = param.MeshDic;
                        var filename = temp.name;
                        var modelName = temp.name;
                        var logpath = earth.RootPath + "temp";
                        var savemethod = 1;
                        operSeqMgr.push((function(info){
                            return function(){
                                var obj = info.obj;
                                var result = generateEditDll.run_single_ref_no_thread(info.guid, info.server, info.filepath, info.modelName, info.SpatialRef, info.logpath);
                                importCurrent++;
                                showProgressBar('导入地面模型 ' + modelName);
                                if (result){
                                    var count = generateEditDll.get_guid_count();
                                    if(count <= 0){
                                        return;
                                    }
                                    guid = generateEditDll.get_at(count - 1);
                                    if (obj.Position.X != 0 || obj.Position.Y != 0 || obj.Position.Z != 0 || 
                                        obj.Rotation.X != 0 || obj.Rotation.Y != 0 || obj.Rotation.Z != 0 || 
                                        obj.Scaling.X != 1 || obj.Scaling.Y != 1 || obj.Scaling.Z != 1){
                                        importItem[guid] = {
                                            id: guid,
                                            name: modelName
                                        };

                                        var name = "model" + i;
                                        var baseobj = earth.Factory.CreateDataBaseObject(guid, name);
                                        baseobj.SphericalTransform.SetLocationEx(obj.Pivot.X + obj.Position.X, 
                                            obj.Pivot.Y + obj.Position.Y, 
                                            obj.Pivot.Z + obj.Position.Z);
                                        baseobj.SphericalTransform.SetRotation(obj.Rotation);
                                        baseobj.SphericalTransform.SetScale(obj.Scaling);
                                        baseobj.BBox.SetExtent(obj.MinBoundary, obj.MaxBoundary);
                                        earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,param.guid, guid, baseobj);
                                    }
                                }
                            }
                        })({
                            guid: param.guid,
                            server: server,
                            filepath: filepath,
                            modelName: modelName,
                            SpatialRef: param.SpatialRef,
                            logpath: logpath,
                            savemethod: savemethod,
                            obj: obj
                        }));
                    }
                }
            }
        }
    };

    /**
     * 导入建筑模型
     * @param  {[type]} param [description]
     * @return {[type]}       [description]
     */
    var _saveBuildingModelObject = function(param){
        return _saveBuildingModelObject2(param);
    };

    var _saveBuildingModelObject2 = function(param){
        if (param != null && param["type"] == 1){
            var datum = param.Datum;
            var serverIP = STAMP_config.server.dataServerIP;
            var offset = m_projectOffsetList.item(param.ProjectGuid);
            var nodeNum = param.node.length? param.node.length : 1;
            var fns = [];
            var veBuildingNum = param.node.length ? param.node.length : 1;
            for(var p = 0; p < veBuildingNum; p++){
                var childNode;
                if(param.node.length == undefined){
                    childNode = param.node;
                }else{
                    childNode = param.node[p];
                }
                var obj = VEPrjObject(childNode["VEModel"]);
                var srcLct = earth.Factory.CreateVector3();
                srcLct.X = obj.Pivot.X + obj.Position.X;
                srcLct.Y = obj.Pivot.Y + obj.Position.Y;
                srcLct.Z = obj.Pivot.Z + obj.Position.Z;
                var location = src_xy_to_des_BLH(srcLct, param.Datum);

                var guid = "";
                var server = serverIP;
                var filepath = param.MeshDic;
                var filename = childNode.name;
                var modelName = childNode.VEModel.name;
                var logpath = earth.RootPath + "temp";
                var savemethod = 1;
                filepath = filepath + "\\" + filename;
                
                operSeqMgr.push((function(info){
                    return function(){
                        var obj = info.obj;
                        var result = generateEditDll.run_single_ref_no_thread(info.guid, info.server, info.filepath, info.modelName, info.SpatialRef, info.logpath/*, info.savemethod*/);                    
                        importCurrent++;
                        showProgressBar('导入建筑模型 ' + modelName);
                        if (result){
                            var count = generateEditDll.get_guid_count();
                            if(count <= 0){
                                return;
                            }
                            guid = generateEditDll.get_at(count - 1);
                            if (obj.Position.X != 0 || obj.Position.Y != 0 || obj.Position.Z != 0 || 
                                obj.Rotation.X != 0 || obj.Rotation.Y != 0 || obj.Rotation.Z != 0 || 
                                obj.Scaling.X != 1 || obj.Scaling.Y != 1 || obj.Scaling.Z != 1
                                ){
                                importItem[guid] = {
                                    id: guid,
                                    name: modelName
                                };
                                    
                                var name = "model" + i;
                                var baseobj = earth.Factory.CreateDataBaseObject(guid, name);
                                baseobj.SphericalTransform.SetLocationEx(obj.Pivot.X + obj.Position.X, 
                                    obj.Pivot.Y + obj.Position.Y, 
                                    obj.Pivot.Z + obj.Position.Z);
                                baseobj.SphericalTransform.SetRotation(obj.Rotation);
                                baseobj.SphericalTransform.SetScale(obj.Scaling);
                                baseobj.BBox.SetExtent(obj.MinBoundary, obj.MaxBoundary);
                                earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,param.guid, guid, baseobj);
                            }
                            // 更新数据库建筑物表中模型的ID
                            Update("CPBUILDING", obj.Guid, "ID", guid);
                            // 更新数据库附件表中建筑附件的模型ID
                            UpdateAttachment("CPATTACHMENT", "PLANID", obj.Guid, "PLANID", guid);
                        }
                    }
                })({
                    guid: param.guid,
                    server: server,
                    filepath: filepath,
                    modelName: modelName,
                    SpatialRef: param.SpatialRef,
                    logpath: logpath,
                    savemethod: savemethod,
                    obj: obj
                }));
            }
        }
    };

    var VEPrjObject = function(node){
        if (node != null){
            var m_guid = node.id;
            var m_name = node.name;
            var m_visibility = node.Visibility;
            var m_intersectable = node.Intersectable;
            var m_alphaBlend = node.AlphaBlend;
            var m_position;
            var m_quaternion;
            var m_rotation;
            var m_scaling;
            var m_pivot;
            var m_maxBoundary;
            var m_minBoundary;
            if(node.Position){
                m_position = TransformToVec3(node.Position);
            }
            if(node.Quaternion){
                m_quaternion = TransformToQuat4(node.Quaternion);
            }
            if(node.Rotation){
                m_rotation = TransformToVec3(node.Rotation);
            }
            if(node.Scaling){
                m_scaling = TransformToVec3(node.Scaling);
            }
            if(node.Pivot){
                m_pivot = TransformToVec3(node.Pivot);
            }
            if(node.BBox){
                m_maxBoundary = TransformToVec3(node.BBox.MaxBoundary);
                m_minBoundary = TransformToVec3(node.BBox.MinBoundary);
            }
            var m_link = node.Link;
            return {
                Guid:m_guid,
                Name:m_name,
                Visibility:m_visibility,
                Intersectable:m_intersectable,
                AlphaBlend:m_alphaBlend,
                Position:m_position,
                Quaternion:m_quaternion,
                Rotation:m_rotation,
                Scaling:m_scaling,
                Pivot:m_pivot,
                MaxBoundary:m_maxBoundary,
                MinBoundary:m_minBoundary,
                Link:m_link
            };
        }
    };

    var  TransformToVec3 = function(node){
        var result = null;
        var values = node.split(',');
        if (values.length == 3){
            result = earth.Factory.CreateVector3();
            result.SetValue(Number(values[0]), Number(values[1]), Number(values[2]));
        }
        return result;
    };

    var  TransformToQuat4 = function(node){
        var result = {};
        var values = node.split(',');
        if (values.length == 4){
            result.X = Number(values[0]);
            result.Y = Number(values[1]);
            result.Z = Number(values[2]);
            result.W = Number(values[3]);
        }
        return result;
    };

    /**
     * 向数据库中添加一条树或小品的记录
     */
    var _addRecordInLayer = function(node, param, offset, dic){
        var obj = VEPrjObject(node);
        var min = earth.Factory.CreateVector3();
        min.SetValue(1, 1, 1);
        var max = earth.Factory.CreateVector3();
        max.SetValue(2, 2, 2);

        var meshid = -1;
        if (dic.item(obj.Link)){
            meshid = dic.item(obj.Link);
        }else{
            var path = param.MeshDic + "\\" + obj.Link;
            meshid = ImportUsx(dataProcess, STAMP_config.server.dataServerIP, param.guid, path, min, max);
            if (meshid >= 0){
                dic.item(obj.Link) = meshid;
            }
        }
        if (meshid >= 0){
            var databasedata = earth.Factory.CreateDataBaseObject(obj.Guid, obj.Name);
            databasedata.MeshID = meshid;
            databasedata.BBox.SetExtent(min, max);
            var srcLct = earth.Factory.CreateVector3();
            srcLct.X = obj.Position.X;
            srcLct.Z = obj.Position.Z;
            srcLct.Y = obj.Position.Y;
            var location = src_xy_to_des_BLH(srcLct, param.Datum);

            var rotation = earth.Factory.CreateVector3();
            rotation.X = -1.0 * obj.Rotation.X;
            rotation.Y = -1.0 * obj.Rotation.Y;
            rotation.Z = -1.0 * obj.Rotation.Z;

            databasedata.SphericalTransform.SetLocation(location);
            databasedata.SphericalTransform.SetRotation(rotation);
            databasedata.SphericalTransform.SetScale(obj.Scaling);
            databasedata.Type = param.type;

            importItem[obj.Guid] = {
                id: obj.Guid,
                name: obj.Name
            };

            earth.DatabaseManager.AddRecordInLayer(STAMP_config.server.dataServerIP,param.guid, databasedata);
        }
    };

    var ImportUsx = function(dataProcess, url, guid, fullpath, min, max){
        var index = fullpath.lastIndexOf("\\");
        if (index < 0){
            return -1;
        }
        var name = fullpath.substring(index + 1);
        var path = fullpath.substring(0, index);
        var singleimport = dataProcess.SingleMeshImport;
        singleimport.Set_Server_IP(url);
        singleimport.Set_Layer_GUID(guid);
        singleimport.Set_Illumination(true);
        singleimport.Set_Save_Type(1);//0-存文件，1-存数据库，2-both
        singleimport.Init();
        var id = singleimport.Process_File(path, name);
        return id;
    };

    /**
     * Event.OnEditDatabaseFinished事件处理函数
     * @param pRes 包含ExcuteType属性，标识处理操作类型
     * @param pLayer ISEDatabaseLayer
     */
    var Earth_OnEditDatabaseFinished = function (pRes, pLayer) {
        var layerGUID; 
        var isSuccess = false;
        if (pRes.ExcuteType === 1) {
            layerGUID = pRes.LayerGuid;
            isSuccess = true;

            importCurrent++;
            var ln = importItem[layerGUID];
            ln = (ln != undefined && ln.name != undefined) ? ln.name : '';
            showProgressBar('导入图层 ' + ln);
            delete importItem[layerGUID];
        }else if(pRes.ExcuteType === 0 && pRes.LayerGuid != ""){
            layerGUID = pRes.LayerGuid;
        }else if(pRes.ExcuteType == 17 && pRes.LayerGuid != ""){
            importCurrent++;
            var ln = importItem[pRes.LayerGuid];
            ln = (ln != undefined && ln.name != undefined) ? ln.name : '';
            showProgressBar('导入 ' + ln);
            delete importItem[pRes.LayerGuid];
        }else if(pRes.ExcuteType == 2 && pRes.RecordGuid != ''){
            importCurrent++;
            var ln = importItem[pRes.RecordGuid];
            ln = (ln != undefined && ln.name != undefined) ? ln.name : '';
            showProgressBar('导入 ' + ln);
            delete importItem[pRes.RecordGuid];
        }else if(pRes.ExcuteType == 6 && pRes.RecordGuid != ''){
            importCurrent++;
            var ln = importItem[pRes.RecordGuid];
            ln = (ln != undefined && ln.name != undefined) ? ln.name : '';
            showProgressBar('更新模型 ' + ln);
            delete importItem[pRes.RecordGuid];
            hideProgress();
        }else{
            return;
        }
        //从事件回调中获取图层的guid
        var keys = m_importLayerParams.Keys().toArray();
        //根据guid获取其对应的参数param 来自于layerIDs数组
        var obj;
        for(var i = 0; i < keys.length; i++){
            if(keys[i] === layerGUID){
                obj = m_importLayerParams.item(layerGUID);
                break;
            }
        }

        if(importCurrent == asyncTotal){
            operSeqMgr.start(30, false, hideProgress);
        }

        if (!obj) {
            return;
        }
        //类型
        var type = obj.type;
        if(isSuccess){
            switch (type) {// 0 1 2 3 
                case 5: // 导入规划专题中的规划用地或建筑矢量面
                    _savePolygonObject(obj);
                    break;
                case 4:// 导入规划专题中的道路红线
                    _savePolylineObject(obj);
                    break;
                case 3://导入方案中的小品
                    _saveMatchModel(obj);
                    break;
                case 2: //导入方案中的树
                    _saveBillBoard(obj);
                    break;
                case 11: //导入方案中的.usb或.usx数据(地面模型)
                    _saveGroundModelObject(obj);
                    break;
                case 1: //导入方案中的.usb或.usx数据(建筑模型)
                    _saveBuildingModelObject(obj);
                    break;
                default:
                    break;
            }
        }
    };

    var initApproveXML = function (data) {
        var configXml = '<xml>';
        if (data && data.length) {
            for (var i = 0; i < data.length; i++) {
                configXml = configXml + '<Project>' + data[i] + '</Project>'; 
            }
        }
        configXml = configXml + '</xml>';
        return configXml;
    }

    var getImportTotal = function(veprjPath){
        var veprjConfigXml = earth.UserDocument.LoadXmlFile(veprjPath);
        var xmlDoc = top.loadXMLStr(veprjConfigXml);
        var prjInfo = $.xml2json(xmlDoc);
        var c = 0;
        var c2 = 0;
        if(prjInfo.VEProject.VEPlotPlan){
            c++;
            c2++;
            if(prjInfo.VEProject.VEPlotPlan.VEPlotPlan){
                if($.isArray(prjInfo.VEProject.VEPlotPlan.VEPlotPlan)){
                    for(var i = 0; i < prjInfo.VEProject.VEPlotPlan.VEPlotPlan.length; i++){
                        c++;
                        c2++;
                    }
                }else{
                    c++;
                    c2++;
                }
            }
        }
        if(prjInfo.VEProject.VERoadRedLine){
            c++;
            c2++;
            if($.isArray(prjInfo.VEProject.VERoadRedLine.VERoadRedLine)){
                for(var i = 0; i < prjInfo.VEProject.VERoadRedLine.VERoadRedLine.length; i++){
                    c++;
                    c2++;
                }
            }else{
                c++;
                c2++;
            }
        }

        /**
        * 不再对平整线计数
        * 虽然不知道为什么，但平整线addlayer时确确实实的失败了，有可能是对规划图层(-2)做了限制
        **/
        if(prjInfo.VEProject.VESmoothLine){
            c++;
            c2++;
            if($.isArray(prjInfo.VEProject.VESmoothLine.VESmoothLine)){
                for(var i = 0; i < prjInfo.VEProject.VESmoothLine.VESmoothLine.length; i++){
                    c++;
                    c2++;
                }
            }else{
                c++;
                c2++;
            }
        }
        var schemes = prjInfo.VEProject.VEScheme;
        if(schemes){
            if(!$.isArray(schemes)){
                schemes = [schemes];
            }
            for(var i = 0;i < schemes.length;i++){
                var scheme = schemes[i];
                var groups = scheme.VEGroup;
                if(groups){
                    if(!$.isArray(groups)){
                        groups = [groups];
                    }
                    for(var j = 0;j < groups.length;j++){
                        var group = groups[j];
                        if(group.name == '地面模型'){
                            c++;//地面模型图层数
                            c2++;
                            var models = group.VEModel;
                            if(models){
                                if(!$.isArray(models)){
                                    models = [models];
                                }
                                c += models.length;//地面模型数量
                                for(var k = 0;k < models.length;k++){
                                    if(models[k].Position != '0,0,0' || 
                                        models[k].Rotation != '0,0,0' || 
                                        models[k].Scaling != '1,1,1'){
                                        c++;
                                    }
                                }
                            }
                        }else if(group.name == '建筑模型'){
                            var bLands = group.VELand;
                            if(bLands){
                                if(!$.isArray(bLands)){
                                    bLands = [bLands];
                                }
                                for(var t = 0; t < bLands.length; t++){
                                    var bLandObj = bLands[t];
                                    var bsets = bLandObj.VEBuildingSet;
                                    if(bsets){
                                        if(!$.isArray(bsets)){
                                            bsets = [bsets];
                                        }
                                        if(bsets.length > 0){
                                            c += 2;//模型图层和基底矢量面图层
                                            c2 += 2;
                                        }
                                        for(var k = 0;k < bsets.length;k++){
                                            var models = bsets[k].VEModel;
                                            if(models){
                                                if(!$.isArray(models)){
                                                    models = [models];
                                                }
                                                c += models.length;//添加模型
                                                for(var l = 0;l < models.length;l++){
                                                    if(models[l].Position != '0,0,0' || 
                                                        models[l].Rotation != '0,0,0' || 
                                                        models[l].Scaling != '1,1,1'){
                                                        c++;//更新模型坐标位置
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }else if(group.name == '小品'){
                            c++;
                            c2++;
                            var msets = group.VEMatchModelSet;
                            if(msets){
                                if(!$.isArray(msets)){
                                    msets = [msets];
                                }
                                for(var k = 0;k < msets.length;k++){
                                    var models = msets[k].VEMatchModel;
                                    if(models){
                                        if(!$.isArray(models)){
                                            models = [models];
                                        }
                                        c += models.length;
                                        c2 += models.length;
                                    }
                                }
                            }
                        }else if(group.name == '树'){
                            c++;
                            c2++;
                            var bsets = group.VEBillboardSet;
                            if(bsets){
                                if(!$.isArray(bsets)){
                                    bsets = [bsets];
                                }
                                for(var k = 0;k < bsets.length;k++){
                                    var models = bsets[k].VEBillboard;
                                    if(models){
                                        if(!$.isArray(models)){
                                            models = [models];
                                        }
                                        c += models.length;
                                        c2 += models.length;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        var t = {
            total: c,
            async: c2
        };
        return t;
    };

    var progressBar = {
        show: function() {
            var h = $(window).height();
            h *= 1 / 2;
            top.getOperatorObject().$('#pbContainer1').css('top', h + 'px');
            top.getOperatorObject().$('#layoutMask').fadeTo(0, 0.66);
            top.getOperatorObject().$('#pbContainer1').show();
        },
        hide: function() {
            top.getOperatorObject().$('#layoutMask').hide();
            top.getOperatorObject().$('#pbContainer1').hide();
        },
        setValue: function(current, total, text) {
            top.getOperatorObject().$('#pbText').text(text != undefined ? text : '');
            top.getOperatorObject().$('#progressBar').progressbar({
                width: 200,
                value: current / total * 100,
                text: '总进度: ' + current + '/' + total
            });
        }
    };

    var showProgressBar = function(value, current, total){
        if(progressBar){
            if(importCurrent >= importTotal){//防止current大于total时显示有问题
                importCurrent = importTotal;
            }
            if(current == undefined){
                current = importCurrent;
            }
            if(total == undefined){
                total = importTotal;
            }
            if(current >= total){//防止current大于total时显示有问题
                current = total;
            }
            try{
                progressBar.show();
                progressBar.setValue(current, total, value);
            }catch(e){

            }
        }
    };

    var hideProgressBar = function(){
        if(progressBar){
            progressBar.hide();
        }
    };

    var hideProgress = function(){
        if(importCurrent >= importTotal){
            var prjPath = earth.RootPath + "temp" + "\\" + planPrjName;
            earth.UserDocument.DeleteDirectory(prjPath);
            importCurrent = -1;
            alert("导入完毕,请刷新页面!");
            hideProgressBar();
            enableEarth(true);
            operSeqMgr = null;
            return;
        }
    }

    var enableEarth = function(enable){
        if(!enable){
            earth.GlobeObserver.Stop();
        }
        earth.GlobeObserver.EnablePan = enable;
        earth.GlobeObserver.EnableRotate = enable;
        earth.GlobeObserver.EnableZoom = enable;
        earth.GlobeObserver.EnablePanAuto = enable;
        earth.GlobeObserver.EnableRotateAuto = enable;
    }


    function OperSeqMgr(options){
        this.info = {
            fnArray: [],
            timer: -1,
            abort: false
        };
    }

    $.extend(OperSeqMgr.prototype, {
        push: function(fn){
            var me = this;
            if(typeof fn == 'function'){
                me.info.fnArray.push(fn);
            }else if($.isArray(fn)){
                for(var i in fn){
                    if(typeof fn[i] == 'function'){
                        me.info.fnArray.push(fn[i]);
                    }
                }
            }
        },
        start: function(interval, abortWhenError, callback){
            var me = this;
            var info = me.info;
            var fns = info.fnArray;
            if(interval == null){
                interval = 30;
            }
            if(abortWhenError == null){
                abortWhenError = true;
            }

            function _exec(){
                if(info.timer > 0){
                    clearTimeout(info.timer);
                    info.timer = -1;
                }
                if(fns.length > 0){
                    var f = fns.shift();
                    try{
                        f();
                    }catch(e){
                        if(abortWhenError){
                            info.abort = true;
                        }
                    }
                    if(!info.abort){
                        info.timer = setTimeout(_exec, interval);
                    }
                }else{
                    if(typeof callback == 'function'){
                        callback();
                    }
                }
            }

            if(info.timer <= 0){
                _exec();
            }
        }
    });

    projManager.importProject = importProject;
    return projManager;
};