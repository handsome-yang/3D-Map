/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：统计功能模块
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var elementSphere = null;
var id_timeout;//定时器（查询不到对象时，显示一个球，定时7秒后销毁）
var StatisticsMgr = {
    earth: null,
    /**
     * 功能：初始化管线图层列表
     * 参数：projectId-指定项目的id编号; container-显示管线图层列表的jquery容器对象; callback-管线初始化完成之后的回调函数
     * 返回：无
     */
    initPipelineSelectList: function(projectId, container, callback) {
        container.html("");
        if (projectId == null) return;
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        var pipelineList = top.SystemSetting.getPipeListByLayer(layer);

        if (pipelineList == null) {
            return;
        }

        for (var i = 0; i < pipelineList.length; i++) {
            var pipeLineLayer = pipelineList[i];

            var thisLayer = earth.LayerManager.GetLayerByGUID(pipeLineLayer.id);
            top.LayerManagement.searchLayers.push(thisLayer);
            container.append('<option value="' +
                pipeLineLayer.id + '" server="' + pipeLineLayer.server + '" title="' + pipeLineLayer.name + '">' +
                pipeLineLayer.name + '</option>');
        }

        if (callback != null) {
            callback();
        }
    },

    /**
     * 功能：将table导出成Excel文档
     * 参数：tableId - 要导出的表对象; columns - 列标题数组
     * 返回：无
     */
    importExcelByTable: function(tabObj, columns) {
        var xls = null;
        try {
            xls = new ActiveXObject("Excel.Application");
        } catch (e) {
            alert("无法启动Excel\n\n如果您确信您的电脑中已经安装了Excel, 那么请调整IE的安全级别\n" +
                "具体的操作：\n" +
                "工具 -> Internet选项 -> 安全 -> 自定义级别 -> 对没有标记为安全的ActiveX进行初始化和脚本运行 -> 启用");
            return;
        }
        try {
            xls.visible = true;
            var xlsBook = xls.Workbooks.Add;
            var xlsSheet = xlsBook.WorkSheets(1);

            for (var k = 0; k < columns.length; k++) {
                xlsSheet.Cells(1, k + 1).Value = columns[k];
            }

            var rowList = tabObj.rows;
            for (var i = 0; i < rowList.length; i++) {
                var cellList = rowList[i].cells;
                for (var j = 0; j < cellList.length; j++) {
                    var thisClassName = cellList[j].className;
                    if(thisClassName){
                        var redIndex = thisClassName.indexOf("bgRed");
                        if(redIndex>-1){
                            xlsSheet.Cells(i + 2, j + 1).Interior.ColorIndex = 3;//如果不符合标准则为红色
                        }
                    }
                    xlsSheet.Cells(i + 2, j + 1).Value = cellList[j].innerHTML;    
                }
            }

            xls.UserControl = true;
        } catch (err) {
        }
    },

    /**
     * 功能：根据编码，获取编码对应的详细值
     * 参数：type-编码类型；codeId - 编码ID
     * 返回：编码对应的详细值
     */
    getValueByCode: function(type, codeId) {
        var value = "其他";
        if (codeId === "0" || codeId === " " || codeId === "" || codeId === 0 || codeId === undefined) {
            value = "";
            return;
        }
        var a;
        if (!top.SYSTEMPARAMS) {
            a = earth.pipeConfigDoc
        } else {
            a = top.SYSTEMPARAMS.pipeConfigDoc;
        }
        if (a == null) {
            return;
        }
        if (type == "") {
            return;
        }
        var nodes = a.getElementsByTagName(type);
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var codeNode = node.selectSingleNode("Code");
            if (parseFloat(codeNode.text) == parseFloat(codeId)) {
                value = node.selectSingleNode("Name").text;
                break;
            }
        }
        return value;
    },
    /**
     * 查询不到管点模型时，显示一个几何球
     * @param  {[type]} key         [编号]
     * @param  {[type]} subLayer    [管点子图层]
     * @param  {[type]} layerID     [图层ID]
     * @param  {[type]} pointKey    [管点编号]
     * @param  {[type]} bShow       [是否显示详细信息气泡]
     * @param  {[type]} originCoord [原始坐标]
     * @param  {[type]} htmlStr     [气泡页面html内容]
     * @return {[type]}             [description]
     */
    sphereGotoLookat: function(key, subLayer, layerID, pointKey, bShow, originCoord, htmlStr) {
        var deep = 0; //管点埋深
        var pointHeight = 0; //管线半径&高度;
        var US_SPT_KEY = top.getName("US_SPT_KEY", 1, true);
        var filterStartKey = "(and,eq," + US_SPT_KEY + "," + pointKey + ")";

        var US_EPT_KEY = top.getName("US_EPT_KEY", 1, true);
        var filterEndKey = "(and,eq," + US_EPT_KEY + "," + pointKey + ")";

        var lineResult = this.paramQuery(null, layerID, filterStartKey, 16, 1);
        var lintGotoPage = lineResult.GotoPage(0);
        if (lintGotoPage == "error" || (lineResult!=null && lineResult.RecordCount < 1)) { //用终点key再次查询
            lineResult = this.paramQuery(null, layerID, filterEndKey, 16, 1);
            lintGotoPage = lineResult.GotoPage(0);
        }
        if (lintGotoPage != "error") {
            var lineJson = $.xml2json(lintGotoPage);
            var lineRecords = lineJson.Result.Record;
            if (typeof(lineRecords) == "object") {
                var lineStartKey = lineRecords[top.getName("US_SPT_KEY", 1, true)];
                var lineEndKey = lineRecords[top.getName("US_EPT_KEY", 1, true)];
                var startDeep = lineRecords[top.getName("US_SDEEP", 1, true)];
                var endDeep = lineRecords[top.getName("US_EDEEP", 1, true)];
                pointHeight = parseInt(lineRecords[top.getName("US_SIZE", 1, true)]);

                if (lineStartKey == pointKey) {
                    deep = startDeep;
                } else if (lineEndKey == pointKey) {
                    deep = endDeep;
                }
            } else if (lineRecords instanceof Array) {
                for (var l = 0; l < lineRecords.length; l++) {
                    var red = lineRecords[l];
                    var lineStartKey = red[top.getName("US_SPT_KEY", 1, true)];
                    var lineEndKey = red[top.getName("US_EPT_KEY", 1, true)];
                    var startDeep = red[top.getName("US_SDEEP", 1, true)];
                    var endDeep = red[top.getName("US_EDEEP", 1, true)];
                    pointHeight = parseInt(lineRecords[top.getName("US_SIZE", 1, true)]);
                    if (lineStartKey == pointKey) {
                        deep = startDeep;
                        break;
                    } else if (lineEndKey == pointKey) {
                        deep = endDeep;
                        break;
                    }
                }
            }
        }

        var uskey = top.getName("US_KEY", 0, true);
        var strPara = "";

        strPara += "(or,equal," + uskey + "," + pointKey + ")";

        var param = subLayer.QueryParameter;
        param.Filter = strPara;
        param.QueryType = 17;
        param.QueryTableType = 0;
        var result = subLayer.SearchFromGISServer();
        var PointResult = result.GotoPage(0);
        var object = result.GetLocalObject(0);
        var json = $.xml2json(PointResult);
        var records = json.Result.Record;
        if (records) {
            if(bShow&&htmlStr==null){//如果显示气泡，但是html字符串为空，则需要查询获取管点详细信息生成htmlStr字符串
                StatisticsMgr.showNotLineSphere(layerID, records, htmlStr, deep, pointHeight, bShow);
            }else{
                StatisticsMgr.showNotLineBalloon(layerID, records, htmlStr, deep, pointHeight, bShow);
            }
        }
    },

    /**
     * 查询获取管点详细信息生成htmlStr字符串，并定位显示气泡
     * @param  {[type]} layerID     [图层GUID]
     * @param  {[type]} record      [数据记录]
     * @param  {[type]} htmlStr     [html字符串]
     * @param  {[type]} deep        [埋深]
     * @param  {[type]} pointHeight [管点高度]
     * @param  {[type]} bShow       [是否显示]
     * @return {[type]}             [description]
     */
    showNotLineSphere: function(layerID, record, htmlStr, deep, pointHeight, bShow){
        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
        var strKey=record[top.getName("US_KEY",0,true)];
        var road=record[top.getName("US_ROAD",0,true)];
        var isScra=record[top.getName("US_IS_SCRA",0,true)];
        var bdTime=record[top.getName("US_BD_TIME",0,true)];
        var fxYear=record[top.getName("US_FX_YEAR",0,true)];
        var owner=record[top.getName("US_OWNER",0,true)];
        var state=record[top.getName("US_UPDATE",0,true)];
        var update=record[top.getName("US_UPDATE",0,true)];
        var altitude=(parseFloat(record[top.getName("US_PT_ALT",0,true)])).toFixed(2);
        var attachment = record[top.getName("US_ATTACHMENT",0,true)];
        var pointType = record[top.getName("US_PT_TYPE",0,true)];

        var str_caption=top.getNameNoIgnoreCase("US_KEY",0,false);
        var road_caption=top.getNameNoIgnoreCase("US_ROAD",0,false);
        var isScra_caption=top.getNameNoIgnoreCase("US_IS_SCRA",0,false);
        var bdTime_caption=top.getNameNoIgnoreCase("US_BD_TIME",0,false);
        var fxYear_caption=top.getNameNoIgnoreCase("US_FX_YEAR",0,false);
        var owner_caption=top.getNameNoIgnoreCase("US_OWNER",0,false);
        var state_caption=top.getNameNoIgnoreCase("US_UPDATE",0,false);
        var update_caption=top.getNameNoIgnoreCase("US_UPDATE",0,false);
        var altitude_caption=top.getNameNoIgnoreCase("US_PT_ALT",0,false);
        var attachment_caption = top.getNameNoIgnoreCase("US_ATTACHMENT",0,false);
        var pointType_caption = top.getNameNoIgnoreCase("US_PT_TYPE",0,false);

        //井类型 井直径 井脖深 井底深 井盖类型  井盖规格 井盖材质  井材质  旋转角度  偏心井点号
        var us_well=record[top.getName("US_WELL",0,true)];
        var us_wdia=record[top.getName("US_WDIA",0,true)];
        var us_ndeep=(parseFloat(record[top.getName("US_NDEEP",0,true)])).toFixed(2);
        var us_wdeep=(parseFloat(record[top.getName("US_WDEEP",0,true)])).toFixed(2);
        var us_plate=record[top.getName("US_PLATE",0,true)];
        var us_psize=(parseFloat(record[top.getName("US_PSIZE",0,true)])).toFixed(2);
        var us_pmater=record[top.getName("US_PMATER",0,true)];
        var us_wmater=record[top.getName("US_WMATER",0,true)];
        var us_angle=record[top.getName("US_ANGLE",0,true)];
        var us_offset=record[top.getName("US_OFFSET",0,true)];

        var us_well_caption=top.getNameNoIgnoreCase("US_WELL",0,false);
        var us_wdia_caption=top.getNameNoIgnoreCase("US_WDIA",0,false);
        var us_ndeep_caption=top.getNameNoIgnoreCase("US_NDEEP",0,false);
        var us_wdeep_caption=top.getNameNoIgnoreCase("US_WDEEP",0,false);
        var us_plate_caption=top.getNameNoIgnoreCase("US_PLATE",0,false);
        var us_psize_caption=top.getNameNoIgnoreCase("US_PSIZE",0,false);
        var us_pmater_caption=top.getNameNoIgnoreCase("US_PMATER",0,false);
        var us_wmater_caption=top.getNameNoIgnoreCase("US_WMATER",0,false);
        var us_angle_caption=top.getNameNoIgnoreCase("US_ANGLE",0,false);
        var us_offset_caption=top.getNameNoIgnoreCase("US_OFFSET",0,false);

        if(road==undefined){
            road="";
        }
        if(isScra==undefined){
            isScra="";
        }
        if(bdTime==undefined){
            bdTime="";
        }
        if(fxYear==undefined){
            fxYear="";
        }
        if(owner==undefined){
            owner="";
        }
        if(state==undefined){
            state="";
        }
        if(update==undefined){
            update="";
        }
        var v3s=null;
        var us_key = top.getName("US_KEY",0,true);
        var strPara2 = "(and,equal," +us_key+",";
        strPara2 += strKey;
        strPara2 += ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var strConn=layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc="+strPara2+"&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature){
            if (pRes.ExcuteType == top.SystemSetting.excuteType){
                var xmlStr = pRes.AttributeName;
                var xmlDoc=loadXMLStr(xmlStr);
                v3s=getPlaneCoordinates(layerID,xmlDoc,strKey);
                var tv3s = v3s["datumCoord"];
                originCoord = v3s["originCoord"];
                var X="";
                var Y="";
                if(tv3s){
                    X=(parseFloat(tv3s.X)).toFixed(2);
                    Y=(parseFloat(tv3s.Y)).toFixed(2);
                }
                var str = "";
                str += '<tr><td style="word-wrap:break-word;" width="100">&nbsp;&nbsp;&nbsp;&nbsp;'+str_caption+'</td><td style="word-wrap:break-word;" width="150">&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +record[top.getName("US_KEY",0,true)]+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;X坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +X+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Y坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +Y+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+altitude_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+altitude+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+pointType_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+(pointType==undefined?"":pointType)+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+attachment_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+(attachment==undefined?"":attachment)+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+road_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+road+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+owner_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+owner+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+bdTime_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+bdTime+'</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+state_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+state+'</td></tr>';
                //井相关字段处理
                if(us_well){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_well_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_well+'</td></tr>';
                }
                if(us_wdia && Number(us_wdia)){
                    us_wdia = Number(us_wdia).toFixed(2);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_wdia_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_wdia+'</td></tr>';
                }
                if(us_ndeep && Number(us_ndeep)){
                    us_ndeep = Number(us_ndeep).toFixed(2);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_ndeep_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_ndeep+'</td></tr>';
                }
                if(us_wdeep && Number(us_wdeep)){
                    us_wdeep = Number(us_wdeep).toFixed(2);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_wdeep_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_wdeep+'</td></tr>';
                }
                if(us_plate){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_plate_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_plate+'</td></tr>';
                }
                if(us_psize){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_psize_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_psize+'</td></tr>';
                }
                if(us_pmater){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_pmater_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_pmater+'</td></tr>';
                }
                if(us_wmater){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_wmater_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_wmater+'</td></tr>';
                }
                if(us_angle && Number(us_angle)){
                    us_angle = Number(us_angle).toFixed(2);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_angle_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_angle+'</td></tr>';
                }
                if(us_offset){
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;'+us_offset_caption+'</td><td>&nbsp;&nbsp;&nbsp;&nbsp;'+ "   " +us_offset+'</td></tr>';
                }
                htmlStr = htmlStr + str + '</table></div>';
                StatisticsMgr.showNotLineBalloon(layerID, record, htmlStr, deep, pointHeight, bShow);
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    },

    /**
     * 定位并显示管点详细信息气泡
     * @param  {[type]} layerID     [图层ID]
     * @param  {[type]} record      [记录]
     * @param  {[type]} htmlStr     [气泡内html字符串]
     * @param  {[type]} deep        [深度]
     * @param  {[type]} pointHeight [管点高度]
     * @param  {[type]} bShow       [是否显示详细信息]
     * @return {[type]}             [description]
     */
    showNotLineBalloon: function (layerID, record, htmlStr, deep, pointHeight, bShow) {
        var pointShape = record.SHAPE.Point.Coordinates;
        var x = null;
        var y = null;
        for (var i = 0; i < pointShape.split(",").length; i += 3) {
            x = pointShape.split(",")[i];
            y = pointShape.split(",")[i + 1];
        }
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var intLayerCode = layer.PipeLineType;
        var h = earth.Measure.MeasureTerrainAltitude(x, y);
        pointHeight = (parseFloat(pointHeight) / 1000) / 2; //半径
        var z = Number(h) - Number(deep) - Number(pointHeight);
        if (intLayerCode >= 4000 && intLayerCode < 5000) {
            z = Number(h) - Number(deep) + Number(pointHeight); //排水
        }
        if (bShow) {
            top.LayerManagement.showHtmlBalloon(x, y, z, htmlStr);
        }
        StatisticsMgr.createElementSphere(x, y, z); //创建球
        earth.GlobeObserver.GotoLookat(x, y, z, 0.0, 89.0, 0, 6);
    },

    /**
     * 查询不到时在指定位置创建一个球体
     * @param  {[type]} x [x坐标]
     * @param  {[type]} y [y坐标]
     * @param  {[type]} h [高程]
     * @return {[type]}   [description]
     */
    createElementSphere: function(x, y, h) {
        var radius = 0.3;
        h = h - parseFloat(radius);
        if (elementSphere != null) {
            earth.DetachObject(elementSphere);
            elementSphere = null;
        }
        //获取工厂对象
        var factory = earth.Factory;
        //创建GUID
        var sphereGuid = factory.CreateGUID();
        //创建模型对象
        elementSphere = factory.CreateElementSphere(sphereGuid, "sphere");
        elementSphere.BeginUpdate();
        var lon = x;
        var lat = y;
        var alt = h;
        elementSphere.SphericalTransform.SetLocationEx(lon, lat, alt);
        elementSphere.FillColor = parseInt("0x77ff0000");
        elementSphere.Radius = radius;
        elementSphere.Underground = true;
        elementSphere.EndUpdate();
        earth.ShapeCreator.Clear();
        earth.AttachObject(elementSphere);
        elementSphere.ShowHighLight();
        clearTimeout(id_timeout);
        id_timeout = setTimeout(function(){//7秒后移除临时几何球体
            if(elementSphere != null){
                earth.DetachObject(elementSphere);
                elementSphere = null;
            }
        },7000);
    },

    /**
     * 删除球体
     * @return {[type]} [description]
     */
    detachShere: function() {
        if (elementSphere != null) {
            earth.DetachObject(elementSphere);
            elementSphere = null;
        }
    },

    /**
     * 管线查询
     * @param  {[type]} pFeat          [范围条件]
     * @param  {[type]} guid           [管线图层guid]
     * @param  {[type]} filter         [过滤条件]
     * @param  {[type]} queryType      [查询类型]
     * @param  {[type]} queryTableType [表类型：0管点；1管线]
     * @return {[type]}                [查询结果]
     */
    paramQuery: function(pFeat, guid, filter, queryType, queryTableType) {
        var earth = top.LayerManagement.earth;
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var param = subLayer.QueryParameter;
        param.ClearSpatialFilter();
        if (filter != null) {
            param.Filter = filter;
        }
        if (pFeat != null) {
            param.SetSpatialFilter(pFeat);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType; 
        }
        param.QueryType = queryType; 
        param.PageRecordCount = 12;
        var result = subLayer.SearchFromGISServer();
        return result;
    }
};
