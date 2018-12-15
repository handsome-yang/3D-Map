 /**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：属性查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = top.LayerManagement.earth;
$(function() {
    $(window).unload(function() {});
    if(top.queryCurrentObj != null){
        top.queryCurrentObj.ShowHighLight();
    }
    /**
     * 解析url字符串中传递过来的参数
     * @return {[type]} [description]
     */
    var parseLocation = function() {
        var urlSegs = location.href.split("?");
        var params;
        var keyvalue = null;
        var results = {};
        if (urlSegs.length > 1) {
            params = urlSegs[1].split("&");
            for (var i = 0; i < params.length; i++) {
                keyvalue = params[i].split("=");
                results[keyvalue[0]] = keyvalue[1];
            }
        }
        return results;
    };

    var getCoordinates = function(xmlDoc, layerID, str) {
        return getPlaneCoordinates(layerID, xmlDoc, str);
    };

    var getTempParams = function(xmlDoc, str) {
        return parseResult2(xmlDoc, str);
    };

    var initPointValue = function(layerID, record, layerName, layerID) {
        var str = record[top.getName("US_KEY", bLine, true)];
        var road = record[top.getName("US_ROAD", bLine, true)];
        var isScra = record[top.getName("US_IS_SCRA", bLine, true)];
        var bdTime = record[top.getName("US_BD_TIME", bLine, true)];
        var fxYear = record[top.getName("US_FX_YEAR", bLine, true)];
        var owner = record[top.getName("US_OWNER", bLine, true)];
        var state = record[top.getName("US_UPDATE", bLine, true)];
        var update = record[top.getName("US_UPDATE", bLine, true)];
        var altitude = (parseFloat(record[top.getName("US_PT_ALT", bLine, true)])).toFixed(3);
        var attachment = record[top.getName("US_ATTACHMENT", bLine, true)];

        var pointType = record[top.getName("US_PT_TYPE", bLine, true)];

        var str_caption = top.getNameNoIgnoreCase("US_KEY", bLine, false);
        var road_caption = top.getNameNoIgnoreCase("US_ROAD", bLine, false);
        var isScra_caption = top.getNameNoIgnoreCase("US_IS_SCRA", bLine, false);
        var bdTime_caption = top.getNameNoIgnoreCase("US_BD_TIME", bLine, false);
        var fxYear_caption = top.getNameNoIgnoreCase("US_FX_YEAR", bLine, false);
        var owner_caption = top.getNameNoIgnoreCase("US_OWNER", bLine, false);
        var state_caption = top.getNameNoIgnoreCase("US_UPDATE", bLine, false);
        var update_caption = top.getNameNoIgnoreCase("US_UPDATE", bLine, false);
        var altitude_caption = top.getNameNoIgnoreCase("US_PT_ALT", bLine, false);
        var attachment_caption = top.getNameNoIgnoreCase("US_ATTACHMENT", bLine, false);
        var pointType_caption = top.getNameNoIgnoreCase("US_PT_TYPE", bLine, false);

        //井类型 井直径 井脖深 井底深 井盖类型  井盖规格 井盖材质  井材质  旋转角度  偏心井点号
        var us_well = record[top.getName("US_WELL", bLine, true)];
        var us_wdia = record[top.getName("US_WDIA", bLine, true)];
        var us_ndeep = (parseFloat(record[top.getName("US_NDEEP", bLine, true)])).toFixed(3);
        var us_wdeep = (parseFloat(record[top.getName("US_WDEEP", bLine, true)])).toFixed(3);
        var us_plate = record[top.getName("US_PLATE", bLine, true)];
        var us_psize = record[top.getName("US_PSIZE", bLine, true)];
        var us_pmater = record[top.getName("US_PMATER", bLine, true)];
        var us_wmater = record[top.getName("US_WMATER", bLine, true)];
        var us_angle = record[top.getName("US_ANGLE", bLine, true)];
        var us_offset = record[top.getName("US_OFFSET", bLine, true)];

        var us_well_caption = top.getNameNoIgnoreCase("US_WELL", bLine, false);
        var us_wdia_caption = top.getNameNoIgnoreCase("US_WDIA", bLine, false);
        var us_ndeep_caption = top.getNameNoIgnoreCase("US_NDEEP", bLine, false);
        var us_wdeep_caption = top.getNameNoIgnoreCase("US_WDEEP", bLine, false);
        var us_plate_caption = top.getNameNoIgnoreCase("US_PLATE", bLine, false);
        var us_psize_caption = top.getNameNoIgnoreCase("US_PSIZE", bLine, false);
        var us_pmater_caption = top.getNameNoIgnoreCase("US_PMATER", bLine, false);
        var us_wmater_caption = top.getNameNoIgnoreCase("US_WMATER", bLine, false);
        var us_angle_caption = top.getNameNoIgnoreCase("US_ANGLE", bLine, false);
        var us_offset_caption = top.getNameNoIgnoreCase("US_OFFSET", bLine, false);

        if (road == undefined) {
            road = "";
        }
        if (isScra == undefined) {
            isScra = "";
        }
        if (bdTime == undefined) {
            bdTime = "";
        }else{
            bdTime = bdTime.substr(0,10);
            bdTime = bdTime.replace(/-/g,"/");
        }
        if (fxYear == undefined) {
            fxYear = "";
        }
        if (owner == undefined) {
            owner = "";
        }else{
            owner = top.getCaptionByCustomValue(null,"Ownership",owner);
        }
        if (state == undefined) {
            state = "";
        }
        if (update == undefined) {
            update = "";
        }

        var US_KEY = top.getName("US_KEY", bLine, true);
        var strPara = "(and,equal," + US_KEY + ",";
        strPara += str;
        strPara += ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var layerCode = layer.PipeLineType;
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var v3s = getPlaneCoordinates(layerID, xmlDoc, str);
                var X = "";
                var Y = "";
                if (v3s) {
                    X = (parseFloat(v3s.X)).toFixed(3);
                    Y = (parseFloat(v3s.Y)).toFixed(3);
                }

                $("#tblPointResult").append('<tr><td class="col w40p">' + str_caption + '</td><td class="col w60p" style="word-wrap:break-word;" width="150">' + record[top.getName("US_KEY", bLine, true)] + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">X坐标</td><td class="col w60p">' + X + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">Y坐标</td><td class="col w60p">' + Y + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + altitude_caption + '</td><td class="col w60p">' + altitude + '</td></tr>');

                $("#tblPointResult").append('<tr><td class="col w40p">' + pointType_caption + '</td><td class="col w60p">' + top.getCaptionByCustomValue(layerCode, "PointType", pointType == undefined ? "" : pointType) + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + attachment_caption + '</td><td class="col w60p">' + top.getCaptionByCustomValue(layerCode, "Attachment", attachment == undefined ? "" : attachment) + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + road_caption + '</td><td class="col w60p">' + road + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + owner_caption + '</td><td class="col w60p">' + owner + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + bdTime_caption + '</td><td class="col w60p">' + bdTime + '</td></tr>');
                $("#tblPointResult").append('<tr><td class="col w40p">' + state_caption + '</td><td class="col w60p">' + state + '</td></tr>');
                //井相关字段处理
                if (us_well) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_well_caption + '</td><td class="col w60p">' + us_well + '</td></tr>');
                }
                if (us_wdia && Number(us_wdia)) {
                    us_wdia = Number(us_wdia).toFixed(3);
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_wdia_caption + '</td><td class="col w60p">' + us_wdia + '</td></tr>');
                }
                if (us_ndeep && Number(us_ndeep)) {
                    us_ndeep = Number(us_ndeep).toFixed(3);
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_ndeep_caption + '</td><td class="col w60p">' + us_ndeep + '</td></tr>');
                }
                if (us_wdeep && Number(us_wdeep)) {
                    us_wdeep = Number(us_wdeep).toFixed(3);
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_wdeep_caption + '</td><td class="col w60p">' + us_wdeep + '</td></tr>');
                }
                if (us_plate) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_plate_caption + '</td><td class="col w60p">' + us_plate + '</td></tr>');
                }
                if (us_psize) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_psize_caption + '</td><td class="col w60p">' + us_psize + '</td></tr>');
                }
                if (us_pmater) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_pmater_caption + '</td><td class="col w60p">' + top.getCaptionByCustomValue(layerCode, "MaterialType", us_pmater) + '</td></tr>');
                }
                if (us_wmater) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_wmater_caption + '</td><td class="col w60p">' + us_wmater + '</td></tr>');
                }
                if (us_angle && Number(us_angle)) {
                    us_angle = Number(us_angle).toFixed(3);
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_angle_caption + '</td><td class="col w60p">' + us_angle + '</td></tr>');
                }
                if (us_offset) {
                    $("#tblPointResult").append('<tr><td class="col w40p">' + us_offset_caption + '</td><td class="col w60p">' + us_offset + '</td></tr>');
                }

                initCustomValue("point", record); //显示自定义字段
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    };

    var initPointOnLineValue = function(layerID, record, layerName, type, tableName, v3s, params) {
        var pointType = "";
        var altitude = "";
        var pointType_caption;
        var altitude_caption;
        if (params) {
            //特征--管点
            pointType = params[top.getName("US_PT_TYPE", 0, true)];
            pointType_caption = top.getNameNoIgnoreCase("US_PT_TYPE", 0, false);
            //地面高程--管点
            altitude = params[top.getName("US_PT_ALT", 0, true)];
            altitude_caption = top.getNameNoIgnoreCase("US_PT_ALT", 0, false);;
            altitude = parseFloat(altitude).toFixed(3) || "";

            var attachment = params[top.getName("US_ATTACHMENT", 0, true)] || "";
        }

        var X = "";
        var Y = "";
        if (v3s) {
            X = (parseFloat(v3s.X)).toFixed(3);
            Y = (parseFloat(v3s.Y)).toFixed(3);
        }
        //起点埋深
        var sdeep = record[top.getName("US_SDEEP", 1, true)] || 0;
        //终点埋深
        var edeep = record[top.getName("US_EDEEP", 1, true)] || 0;
        //起点高程
        var sAlt = record[top.getName("US_SALT", 1, true)] || 0;
        var eAlt = record[top.getName("US_EALT", 1, true)] || 0;
        var road = record[top.getName("US_ROAD", 0, true)] || "";

        //管点编号
        var pointKey = (type == 0 ? (record[top.getName("US_SPT_KEY", 1, true)]) : (record[top.getName("US_EPT_KEY", 1, true)]));

        var sdeep_caption = top.getName("US_SDEEP", 1, false) || 0;
        var edeep_caption = top.getName("US_EDEEP", 1, false) || 0;
        var sAlt_caption = top.getName("US_SALT", 1, false) || 0;
        var eAlt_caption = top.getName("US_EALT", 1, false) || 0;
        var road_caption = top.getNameNoIgnoreCase("US_ROAD", 0, false) || "";
        var pointKey_caption = (type == 0 ? (top.getName("US_SPT_KEY", 1, false)) : (top.getName("US_EPT_KEY", 1, false)));
        var attachment_caption = top.getNameNoIgnoreCase("US_ATTACHMENT", 0, false);


        sdeep = parseFloat(sdeep).toFixed(3) || "";
        edeep = (parseFloat(edeep)).toFixed(3) || "";
        sAlt = parseFloat(sAlt).toFixed(3) || "";
        eAlt = parseFloat(eAlt).toFixed(3) || "";

        $("#" + tableName).append('<tr><td class="col w75p">' + pointKey_caption + '</td><td class="col w25p" style="word-wrap:break-word;" width="150">' + pointKey + '</td></tr>');
        $("#" + tableName).append('<tr><td class="col w75p">' + "X" + '</td><td class="col w25p">' + X + '</td></tr>');
        $("#" + tableName).append('<tr><td class="col w75p">' + "Y" + '</td><td class="col w25p">' + Y + '</td></tr>');
        $("#" + tableName).append('<tr><td class="col w75p">' + altitude_caption + '</td><td class="col w25p">' + altitude + '</td></tr>');
        if (type == 0) {
            $("#" + tableName).append('<tr><td class="col w75p">' + sdeep_caption + '</td><td class="col w25p">' + sdeep + '</td></tr>');
            $("#" + tableName).append('<tr><td class="col w75p">' + sAlt_caption + '</td><td class="col w25p">' + sAlt + '</td></tr>');
        } else {
            $("#" + tableName).append('<tr><td class="col w75p">' + edeep_caption + '</td><td class="col w25p">' + edeep + '</td></tr>');
            $("#" + tableName).append('<tr><td class="col w75p">' + eAlt_caption + '</td><td class="col w25p">' + eAlt + '</td></tr>');
        }
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var layerCode = layer.PipeLineType;
        $("#" + tableName).append('<tr><td class="col w75p">' + pointType_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(layerCode, "PointType", pointType == undefined ? "" : pointType) + '</td></tr>');

        $("#" + tableName).append('<tr><td class="col w75p">' + attachment_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(layerCode, "Attachment", attachment == undefined ? "" : attachment) + '</td></tr>');

        var owner = record[top.getName("US_OWNER", 0, true)];
        var bdTime = record[top.getName("US_BD_TIME", 0, true)];
        var owner_caption = top.getName("US_OWNER", 0, false);
        var bdTime_caption = top.getName("US_BD_TIME", 0, false);
        bdTime = (bdTime == undefined ? "" : bdTime);
        if(bdTime){
            bdTime = bdTime.substr(0,10);
            bdTime = bdTime.replace(/-/g,"/");
        }
        if(owner == undefined){
            owner = "";
        }else{
            owner = top.getCaptionByCustomValue(null,"Ownership",owner);
        }

        $("#" + tableName).append('<tr><td class="col w40p">' + bdTime_caption + '</td><td class="col w60p">' + bdTime + '</td></tr>');

        var isScra = record[top.getName("US_IS_SCRA", 0, true)]; //废弃年月
        var update = record[top.getName("US_UPDATE", 0, true)]; //更新
        var update_caption = top.getName("US_UPDATE", 0, true); //更新
        if (update == undefined) {
            update = "";
        }
        if (isScra == undefined) {
            isScra = "";
        }
        if (update_caption) {
            $("#" + tableName).append('<tr><td class="col w40p">' + update_caption + '</td><td class="col w60p">' + update + '</td></tr>');
        }
    };

    var deleteNullAndUndefine = function(tableName) {
        var arr = new Array();
        $("#" + tableName).find("tr").each(function(e, o) {
            if ($.inArray($(o).find("td").eq(0).text(), arr) >= 0 || $(o).find("td").eq(0).text() == "" || $(o).find("td").eq(0).text() == "undefined" || $(o).find("td").eq(1).text() == "" || $(o).find("td").eq(1).text() == "undefined") {
                $(o).hide();

            } else {
                arr.push($(o).find("td").eq(0).text());
            }
        });
    }
    /**
     * 构造管线属性显示html字符串
     * @param  {[string]} layerID   [图层guid]
     * @param  {[object]} record    [此条记录]
     * @param  {[string]} layerName [图层名称]
     * @return {[type]}           [description]
     */
    var initLineValue = function(layerID, record, layerName) {
        $("#lineDiv>div").attr("title", "管线属性");
        var US_PMATER = (top.getName("US_PMATER", bLine, true));
        var us_pmater_caption = (top.getName("US_PMATER", bLine, false));
        var material = record[US_PMATER]; //管线材质

        var US_LTTYPE = (top.getName("US_LTTYPE", bLine, true));
        var US_LTTYPE_caption = (top.getName("US_LTTYPE", bLine, false));
        var lineType = record[US_LTTYPE]; //埋设类型

        var US_PDIAM = (top.getName("US_SIZE", bLine, true));
        var US_PDIAM_caption = (top.getName("US_SIZE", bLine, false));
        var diam = record[US_PDIAM];
        if(diam.indexOf("X") == -1){
            diam = parseFloat(parseFloat(diam).toFixed(2));//管径
        }

        var US_IS_SCRA = (top.getName("US_IS_SCRA", bLine, true));
        var US_IS_SCRA_caption = (top.getName("US_IS_SCRA", bLine, false));
        var isScra = record[US_IS_SCRA];
        var US_BD_TIME = (top.getName("US_BD_TIME", bLine, true));
        var US_BD_TIME_caption = (top.getName("US_BD_TIME", bLine, false));
        var bdTime = record[US_BD_TIME];//埋设时间

        var US_FX_YEAR = (top.getName("US_FX_YEAR", bLine, true));
        var US_FX_YEAR_caption = (top.getName("US_FX_YEAR", bLine, false));

        var US_STATE = (top.getName("US_STATUS", bLine, true));
        var US_STATE_caption = (top.getName("US_STATUS", bLine, false));
        var state = record[US_STATE];
        state = top.getCaptionByCustomValue(null,"StatusType",state);

        var US_UPDATE = (top.getName("US_UPDATE", bLine, true));
        var US_UPDATE_caption = (top.getName("US_UPDATE", bLine, false));
        var update = record[US_UPDATE];

        var US_OWNER = (top.getName("US_OWNER", bLine, true));
        var US_OWNER_caption = (top.getName("US_OWNER", bLine, false));
        var owner = record[US_OWNER];

        var US_ROAD = (top.getName("US_ROAD", bLine, true));
        var US_ROAD_caption = (top.getName("US_ROAD", bLine, false));
        var road = record[US_ROAD];


        var US_LType = (top.getName("US_LType", bLine, true));
        var US_LType_caption = (top.getName("US_LType", bLine, false));
        var ltype = record[US_LType];

        if (bdTime == undefined) {
            bdTime = "";
        }else{
            bdTime = bdTime.substr(0,10);
            bdTime = bdTime.replace(/-/g,"/");
        }
        if (state == undefined) {
            state = "";
        }
        if (update == undefined) {
            update = "";
        }
        if (isScra == undefined) {
            isScra = "";
        }
        if (owner == undefined) {
            owner = "";
        }else{
            owner = top.getCaptionByCustomValue(null,"Ownership",owner);
        }
        if (road == undefined) {
            road = "";
        }
        if (ltype == undefined) {
            ltype = "";
        }

        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var intLayerCode = layer.PipeLineType;
        var str_caption = top.getNameNoIgnoreCase("US_KEY", bLine, false);
        $("#tblLineResult").append('<tr><td class="col w75p">' + str_caption + '</td><td class="col w25p" style="word-wrap:break-word;" width="150">' + record[top.getName("US_KEY", bLine, true)] + '</td></tr>');
        initPointOnLineValue(layerID, record, layerName, 0, "tblLineResult");
        initPointOnLineValue(layerID, record, layerName, 1, "tblLineResult");

        $("#tblLineResult").append('<tr><td class="col w75p">' + US_LTTYPE_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(intLayerCode, "LayoutType", lineType) + '</td></tr>');
        $("#tblLineResult").append('<tr><td class="col w75p">' + us_pmater_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(intLayerCode, "MaterialType", material == undefined ? "" : material) + '</td></tr>');
        $("#tblLineResult").append('<tr><td class="col w75p">' + US_LType_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(intLayerCode, "LineType", ltype) + '</td></tr>');
        if (diam != 0) {
            $("#tblLineResult").append('<tr><td class="col w75p">' + US_PDIAM_caption + '</td><td class="col w25p">' + diam + '</td></tr>');
        }
        if (intLayerCode >= 1000 && intLayerCode < 2000) { //压力
            var voltage = record[top.getName("US_PRESSUR", bLine, true)];
            var voltage_caption = top.getName("US_PRESSUR", bLine, false);
            $("#tblLineResult").append('<tr><td class="col w75p">' + voltage_caption + '</td><td class="col w25p">' + (voltage == undefined ? "" : voltage) + '</td></tr>');
        }
        //燃气、热力、工业管线显示
        if ((intLayerCode >= 5000 && intLayerCode < 6000) || (intLayerCode >= 6000 && intLayerCode < 7000) || (intLayerCode >= 7000 && intLayerCode < 8000)) {
            var pressur = record[top.getName("US_PRESSUR", bLine, true)];
            var pressur_caption = top.getName("US_PRESSUR", bLine, false);
            $("#tblLineResult").append('<tr><td class="col w75p">' + pressur_caption + '</td><td class="col w25p">' + top.getCaptionByCustomValue(intLayerCode, "Pressure", pressur != undefined ? pressur : "") + '</td></tr>');
        }
        //排水和工业管道显示
        if ((intLayerCode >= 4000 && intLayerCode < 5000) || (intLayerCode >= 7000 && intLayerCode < 8000)) {
            var flower = record[top.getName("US_FLOWDIR", bLine, true)];
            var flower_caption = top.getName("US_FLOWDIR", bLine, false);
            $("#tblLineResult").append('<tr><td class="col w75p">' + flower_caption + '</td><td class="col w25p">' + (flower == undefined ? "" : flower) + '</td></tr>');
        }
        //电力、电信
        if ((intLayerCode >= 1000 && intLayerCode < 2000) || (intLayerCode >= 2000 && intLayerCode < 3000)) {
            var ventnum = record[top.getName("US_VENTNUM", bLine, true)];
            var holeto = record[top.getName("US_HOLETOL", bLine, true)];
            var holeused = record[top.getName("US_HOLEUSE", bLine, true)];
            var ventnum_caption = top.getName("US_VENTNUM", bLine, false);
            var holeto_caption = top.getName("US_HOLETOL", bLine, false);
            var holeused_caption = top.getName("US_HOLEUSE", bLine, false);
            //电压值
            var US_PSVALUE = (top.getName("US_PSVALUE", bLine, true));
            var US_PSVALUE_caption = (top.getName("US_PSVALUE", bLine, false));
            var psvalue = record[US_PSVALUE];
            $("#tblLineResult").append('<tr><td class="col w75p">' + ventnum_caption + '</td><td class="col w25p">' + (ventnum == undefined ? "" : ventnum) + '</td></tr>');
            $("#tblLineResult").append('<tr><td class="col w75p">' + holeto_caption + '</td><td class="col w25p">' + (holeto == undefined ? "" : holeto) + '</td></tr>');
            $("#tblLineResult").append('<tr><td class="col w75p">' + holeused_caption + '</td><td class="col w25p">' + (holeused == undefined ? "" : holeused) + '</td></tr>');
            $("#tblLineResult").append('<tr><td class="col w75p">' + US_PSVALUE_caption + '</td><td class="col w25p">' + (psvalue == undefined ? "" : psvalue) + '</td></tr>');
        }
        $("#tblLineResult").append('<tr><td class="col w75p">' + US_ROAD_caption + '</td><td class="col w25p">' + road + '</td></tr>');
        $("#tblLineResult").append('<tr><td class="col w75p">' + US_OWNER_caption + '</td><td class="col w25p">' + owner + '</td></tr>');
        $("#tblLineResult").append('<tr><td class="col w75p">' + US_BD_TIME_caption + '</td><td class="col w25p">' + bdTime + '</td></tr>');
        $("#tblLineResult").append('<tr><td class="col w75p">' + US_STATE_caption + '</td><td class="col w25p">' + state + '</td></tr>');
        //(bdTime>0?parseFloat(bdTime).toFixed(2):"")

        var str1 = record[top.getName("US_SPT_KEY", bLine, true)];
        var str2 = record[top.getName("US_EPT_KEY", bLine, true)];

        var usKey = top.getName("US_KEY", 0, true);
        var strPara = "(or,equal," + usKey + "," + str1 + "),(or,equal," + usKey + "," + str2 + ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";

        initCustomValue("line", record); //显示自定义字段

        deleteNullAndUndefine("tblLineResult");
    };

    function initCustomValue(type, record, tab) {
        var pipeConfigLink = top.SYSTEMPARAMS.pipeConfigLink;
        var configUrl = "http://" + pipeConfigLink.substr(2).replace("/", "/sde?").replace("PipeConfig.config", "FieldMap.config") + "_sde";
        configUrl = top.SYSTEMPARAMS.pipeFieldMapUrl;

        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var systemDoc = loadXMLStr(xmlStr);
                var jsonData = $.xml2json(systemDoc);
                if (jsonData != null) {
                    var lineFieldMap = null;
                    if (type == "line") {
                        lineFieldMap = jsonData.LineFieldInfo;
                    } else {
                        lineFieldMap = jsonData.PointFieldInfo;
                    }
                    if (!lineFieldMap) {
                        return;
                    }
                    if (lineFieldMap.CustomerFieldList != null && lineFieldMap.CustomerFieldList != undefined && lineFieldMap.CustomerFieldList.FieldMapItem != null && lineFieldMap.CustomerFieldList.FieldMapItem != undefined) {
                        var count = lineFieldMap.CustomerFieldList.FieldMapItem.length;
                        if (count == 0 || count == undefined) {
                            var fidldCaption = lineFieldMap.CustomerFieldList.FieldMapItem.CaptionName;
                            var fieldMapitem = lineFieldMap.CustomerFieldList.FieldMapItem.FieldName;
                            fieldMapitem = fieldMapitem.toUpperCase();
                             if (record[fieldMapitem] || fidldCaption == "备注") {
                                if (type == "line") {
                                    $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + record[fieldMapitem] + '</td></tr>');
                                } else {
                                    $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + record[fieldMapitem] + '</td></tr>');
                                }
                            }
                        } else {
                            for (var i = 0; i < lineFieldMap.CustomerFieldList.FieldMapItem.length; i++) {
                                var fidldCaption = lineFieldMap.CustomerFieldList.FieldMapItem[i].CaptionName;
                                var fieldMapitem = lineFieldMap.CustomerFieldList.FieldMapItem[i].FieldName;
                                fieldMapitem = fieldMapitem.toUpperCase();
                                var val = record[fidldCaption];
                                val = record[fieldMapitem];
                                if (val) {
                                    if (parseInt(val) == 0) {
                                        if (type == "line") {
                                            $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                        } else {
                                            $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                        }
                                    } else {
                                        if (isNaN(val)) { //if是数字类型侧保留3位小数点
                                            if (type == "line") {
                                                $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                            } else {
                                                $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                            }
                                        } else {
                                            if (val.indexOf(".") != -1) { //if是整形直接显示
                                                if (type == "line") {
                                                    $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + parseFloat(val).toFixed(3) + '</td></tr>');
                                                } else {
                                                    $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + parseFloat(val).toFixed(3) + '</td></tr>');
                                                }
                                            } else {
                                                if (type == "line") {
                                                    $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                                } else {
                                                    $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">' + val + '</td></tr>');
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    if(type == "line"){
                                        $("#tblLineResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">   </td></tr>');
                                    }else{
                                        $("#tblPointResult").append('<tr><td class="col w75p">' + fidldCaption + '</td><td class="col w25p">   </td></tr>');
                                    }
                                }
                            }
                        }

                    }
                }
            }
        }
        earth.DatabaseManager.GetXml(configUrl);
    }
    /**
     *获取平面坐标
     */
    function getPlaneCoordinates(layerID, data, usKey) {
        var Record = null;
        var jsonData = $.xml2json(data);
        var US_KEY = top.getName("US_KEY", 0, true);
        if (jsonData == null || !jsonData.Result || jsonData.Result.num == 0) {
            return;
        } else if (jsonData.Result.num == 1) {
            Record = jsonData.Result.Record;
            if (jsonData.Result.Record[US_KEY] != usKey) {
                return false;
            }
        } else if (jsonData.Result.num > 1) {
            for (var i = 0; i < jsonData.Result.num; i++) {
                if (jsonData.Result.Record[i][US_KEY] != usKey) {
                    continue;
                } else {
                    Record = jsonData.Result.Record[i];
                }
            }
        }
        var Coordinates = Record.SHAPE.Point.Coordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        var Coordinate = transformToPlaneCoordinates(layerID, coordinate1);
        return Coordinate;
    }

    function parseResult2(data, usKey) {
        var Record = null;
        var json = $.xml2json(data);
        if (json == null || !json.Result) {
            return;
        }
        var US_KEY = top.getName("US_KEY", 0, true);
        var count = json.Result.num;
        if (count == 0) {
            return false;
        } else if (count == 1) {
            Record = json.Result.Record;
            if (json.Result.Record[US_KEY] != usKey) {
                return false;
            }
        } else {
            for (var i = 0; i < count; i++) {
                if (json.Result.Record[i][US_KEY] != usKey) {
                    continue;
                } else {
                    Record = json.Result.Record[i];
                }
            }
        }
        if (Record == null) {
            return false;
        }
        return Record;
    }
    /**
     *经纬度转平面坐标
     */
    function transformToPlaneCoordinates(layerId, coord) {
        var datum = top.SYSTEMPARAMS.pipeDatum;
        var v3s1 = datum.des_BLH_to_src_xy(coord[0], coord[1], coord[2]); //经纬度转平面坐标
        return v3s1;
    }
    /**
     * 发送异步请求，查询符合条件的管线数据
     * @param queryURL   查询地址
     * @param type       类型：point或者line
     * @param layerID    图层GUID
     */
    var query = function(queryURL, layerID, layerName, bLine) {
        var xmlDoc = loadXMLStr(queryURL);
        var json = $.xml2json(xmlDoc);
        if (json == null || !json.Result) {
            $("#divPointResult").hide();
            $("#divLineResult").hide();
            alert("查询结果不存在，请重新查询！");
            return;
        }
        var records = null;
        var num = json.Result.num;
        if (num == 0) {
            $("#divPointResult").hide();
            $("#divLineResult").hide();
            alert("查询结果不存在，请重新查询！");
            return;
        } else if (num == 1) {
            records = json.Result.Record;
        } else {
            records = json.Result.Record[0];
        }
        var divHeight = $(document.body).height();
        if (bLine) {
            $("#divPointResult").hide();
            $("#divLineResult").height(divHeight);
            $("#divLineResult").show();
            initLineValue(layerID, records, layerName);
        } else {
            $("#divPointResult").height(divHeight);
            $("#divPointResult").show();
            $("#divLineResult").hide();
            initPointValue(layerID, records, layerName, layerID);
        }
    };

    var initRoomValue = function(layerID, record, layerName, layerID) {
        var configXML = top.SYSTEMPARAMS.pipeFieldMap;
        var lineData = configXML.getElementsByTagName("RoomFieldInfo")[0] ? configXML.getElementsByTagName("RoomFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
        //遍历每一个字段
        var str = "";
        if (lineData && lineData.childNodes.length) {
            for (var i = 0; i < lineData.childNodes.length; i++) {
                var item = lineData.childNodes[i];
                var standardName = item.getAttribute("StandardName")
                var fieldName = item.getAttribute("FieldName").toUpperCase();
                var captionName = item.getAttribute("CaptionName");
                var valueF = record[fieldName] ? record[fieldName] : " ";
                str += '<tr><td class="col w40p">' + captionName.replace(/[ ]/g, "") + '</td><td class="col w60p">' + valueF.replace(/[ ]/g, "") + '</td></tr>';
            }
        }
        $("#tblPointResult").append(str);
        var bodyHtml = $("tblPointResult").html();
        $("tblPointResult").html(bodyHtml);
    };
   //判断是否是井室
    var params = parseLocation();
    var bLine = params.c.indexOf("container") > -1||params.c.indexOf("powerline") > -1;
    bLine = (bLine ? 1 : 0);
    var filed = top.getName("US_KEY", bLine, true);
    var strPara = "(and,equal," + filed + "," + params.key + ")"; // + "&pg=0,30";
    var objParams = params.c.split("_");
    var layerID = objParams[0];
    var layer = earth.LayerManager.GetLayerByGUID(layerID);
    if (params.c && params.c.indexOf("room") != -1) { //说明是井室
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=polygon&sc=" + "(3,0,1," + top.currentRoomCenter.X + "," + top.currentRoomCenter.Y + "," + top.currentRoomCenter.Z + ")" + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                var systemJson = $.xml2json(xmlDoc);
                if (systemJson) {
                    $("#divPointResult").show();
                    $("#divLineResult").hide();
                    initRoomValue(layerID, systemJson.Result.Record, layer.Name, layerID);
                }
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    } else {
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.Name == objParams[1]) { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }

        var param = subLayer.QueryParameter;
        if (param == null) {
            alert("查询结果不存在");
            return;
        }
        param.ClearRanges();
        param.ClearCompoundCondition();
        param.ClearSpatialFilter();
        param.Filter = strPara;
        param.QueryType = 17;
        param.QueryTableType = bLine;
        param.PageRecordCount = 10;
        var result = subLayer.SearchFromGISServer();//查询数据库
        query(result.GotoPage(0), layer.Guid, layer.Name, bLine);
    }
    
});