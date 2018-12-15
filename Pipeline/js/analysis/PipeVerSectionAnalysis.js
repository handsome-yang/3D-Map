/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：纵断面js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
earth = top.LayerManagement.earth;
var projectId = top.SYSTEMPARAMS.project;//工程guid
var layer1 = earth.LayerManager.GetLayerByGUID(projectId);
var pipeLineLayers = top.LayerManagement.getPipeListByLayer(layer1);//所有管线图层
setDivHeight();

var GuidArray = [];
var currLayerGuid = null;

$(function () {
    //添加管线
    $("#addPipeline").click(function () {

        earth.ToolManager.SphericalObjectEditTool.Browse();
        earth.focus();
        earth.Event.OnPickObjectEx = onPickObjectEx;
        earth.Query.PickObjectEx(24);
    });
    var lastObject = null;
    /**
     * 添加管线选取馆先后的回调事件
     * 如果符合要求则添加在table中,不然会提示
     */
    var onPickObjectEx = function (pObj) {
        $("#dgDiv thead").show();
        pObj.Underground = true;
        if (lastObject) {
            lastObject.StopHighLight();
        }
        lastObject = pObj;
        pObj.ShowHighLight();
        earth.Event.OnRBDown = function () {
            earth.Event.OnPickObjectEx = function () {
            };
            earth.Query.FinishPick();
            earth.ToolManager.SphericalObjectEditTool.Browse();
        };

        var parentLayerNameTemp = pObj.GetParentLayerName();
        var parentLayerName = parentLayerNameTemp.split("=")[1];
        if (parentLayerName == "" || parentLayerName == "null") {
            return;
        }
        var PObjGUID = parentLayerName.split("_")[0];
        var newLayerID = earth.LayerManager.GetLayerByGUID(PObjGUID).Guid;
        if (parentLayerName.indexOf("container") == -1) {//不是线
            alert("选择对象为非管段,请重新选择!");
            return;
        }
        var checkFlag = checkProject(pObj);
        if (!checkFlag) {
            alert("所选管线不在当前工程,请重新选择");
            return;
        }

        if (currLayerGuid == null) {
            currLayerGuid = newLayerID;
        } else if (newLayerID != currLayerGuid) {
            alert("所选管道不在同一图层,请重新选择!");
            return;
        }
        $("#tabhead").css("visibility", "visible");//解决ie11里面的表头重绘
        var layerName = pObj.GetKey();
        var flag = true;//控制退出当前函数的标志位
        $("#tblResult tbody tr").each(function () {
            var text = $(this).children("td:eq(1)").text();
            if (text == layerName) {
                alert("选中的管道已经添加，请重新选择。");
                flag = false;
                return false;
            }
        });
        if (!flag) {
            return false;   //结束function
        }
        $("#startAnalysis").attr("disabled", false);
        $("#delPipeline").attr("disabled", false);
        $("#clearPipeline").attr("disabled", false);
        InsertObject(pObj);
    };
    /**
     * 在搜索的结果集中根据key值确定具体的对象
     * @param searchResult  搜索结果集
     * @param key           对象的US_KEY值
     * @return {*}          返回匹配的对象
     */
    var filterByKey = function (searchResult, key) {
        var obj = null;
        if (searchResult.RecordCount === 0) {
            return null;
        }
        searchResult.GotoPage(0);
        for (var i = 0; i < searchResult.RecordCount; i++) {
            obj = searchResult.GetLocalObject(i);
            if (null == obj) continue;
            if (obj.GetKey() == key) {
                obj.Underground = true;   // SEObjectFlagType.ObjectFlagUnderground
                return obj;
            }
        }
        return null;
    };

    //插入管线数据到表格中
    var InsertObject = function (obj) {
        var parentLayerName = obj.GetParentLayerName();
        var layerGuid = currLayerGuid.split("_")[0];
        var layer = earth.LayerManager.GetLayerByGUID(layerGuid);
        var pipeLineType = layer.PipeLineType;
        var layerName = layer.Name;
        var type = "line";
        var template = "<tr ondblclick=analysisHighlightObject('" + layerGuid + "','" + type + "','','" + obj.GetKey() + "')><td class='chk'><input type='checkbox' name='chk' value='" + obj.GetKey() + "' checked></td><td class='col1'>" + obj.GetKey() + "</td><td class='col2'>管段</td><td class='col3'>" + layerName + "</td></tr>";
        $("#tblResult tbody").append(template);
        $("#tblResult").resize();
        GuidArray.push(obj.GetKey());

    };
    //清空管线
    $("#clearPipeline").click(function () {
        if ($("#tblResult tbody").children().length == 0) {
            alert("对象列表为空，清空失败！");
            return;
        }
        $("#tblResult tbody").html("");
        currLayerGuid = null;
        GuidArray.splice(0, GuidArray.length);//清空数组
        $("#startAnalysis").attr("disabled", true);
        $("#delPipeline").attr("disabled", true);
        $("#clearPipeline").attr("disabled", true);
    });
    //删除管线
    $("#delPipeline").click(function () {
        if ($("#tblResult tbody").children().length == 0) {
            alert("对象列表为空，删除失败！");
            return;
        }
        var length = ($("input[type=checkbox]:checked")).length;
        if (length < 1) {
            alert("请选中要删除的对象后，再进行此操作！");
            return;
        }
        $("input[type=checkbox]:checked").each(function () { //由于复选框一般选中的是多个,所以可以循环输出选中的值
            for (var i = 0; i < GuidArray.length; i++) {//从GuidArray删除被选中即将删除的guid
                var guid = GuidArray[i];
                if (guid == $(this).val()) {
                    GuidArray.splice(i, 1);
                }
            }
        });
        $("#tblResult tbody>tr:has(:checked)").remove();
        if ($("#tblResult tbody").children().length == 0) {
            $("#startAnalysis").attr("disabled", true);
            $("#delPipeline").attr("disabled", true);
            $("#clearPipeline").attr("disabled", true);
            currLayerGuid = null;
        }
    });
    /**
     * 清空分析结果
     */
    var clear = function () {
        if (pipeLineObjectsList.length > 0 || groundAltitudeList.length > 0
            || pipeLineAltitudeList.length > 0 || strGuidList.length > 0
            || pipeLineList.length > 0) {
            pipeLineObjectsList.splice(0, pipeLineObjectsList.length);
            groundAltitudeList.splice(0, groundAltitudeList.length);
            pipeLineAltitudeList.splice(0, pipeLineAltitudeList.length);
            strGuidList.splice(0, strGuidList.length);
            pipeLineList.splice(0, pipeLineList.length);
            minGroundAltitude = 0;
            maxGroundAltitude = 0;
            minPipeLineAltitude = 0;
            maxPipeLineAltitude = 0;
            flag = true;
            width = 0;
            flow = true;
            IsConnect = true;
        }
    };
    var hasClicked = false;//是否点击了分析按钮
    /**
     * 判断是否添加了管线
     * @returns {boolean}
     */
    function ischeckedPline() {
        var length = ($("input[type=checkbox]:checked")).length;
        if (length < 1) {
            return false;
        }
        else {
            return true;
        }
    }

    /**
     * 分析点击事件
     */
    $("#startAnalysis").click(function () {

        hasClicked = true;
        clear();
        var urlList = [];
        var ischeck = ischeckedPline();//是否有选中的管线
        if (ischeck) {
            $.each(pipeLineLayers, function (i, v) {
                var guid = v.id;
                var server = v.server;
                var type = v.LayerType;
                if (currLayerGuid == null) {
                    return;
                }
                var layerGuid = currLayerGuid.split("_")[0];
                if (guid == layerGuid) {
                    var strConn = server + "pipeline?rt=verticalsect&service=" + guid;
                    strConn += "&aparam=0";

                    $("input[type=checkbox]:checked").each(function () {
                        for (var i = 0; i < GuidArray.length; i++) {
                            if (GuidArray[i] == $(this).val()) {
                                strConn += "," + GuidArray[i];
                            }
                        }
                    });
                    urlList.push({
                        "url": strConn,
                        "layerId": guid,
                        "type": type,
                        "customColor": earth.layerManager.GetLayerByGUID(guid).CustomColor
                    });
                }

            });
            sendService(urlList);
        } else {
            alert("请选中要分析的对象后，再进行此操作！");
        }
    });
    var noResult = true;//是否没有分析结果
    /**
     *  发送请求
     * @param urlList 所有url集合
     */
    var sendService = function (urlList) {
        $("#startAnalysis").attr("disabled", true);
        if (urlList) {
            var tempArr = urlList.shift();
            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                    var xmlStr = pRes.AttributeName;
                    var xmlDoc = loadXMLStr(xmlStr);
                    parseResult(xmlDoc, tempArr.guid, tempArr.type, tempArr.customColor);
                    noResult = false;
                }
                if (noResult && urlList.length == 0) {
                    alert("分析结果为空！");
                }
                if (urlList.length != 0) {
                    sendService(urlList);
                }
            };
            earth.DatabaseManager.GetXml(tempArr["url"]);
        }
    };

    /**
     *解析服务器返回的数据
     */
    var minGroundAltitude = 0;
    var maxGroundAltitude = 0;
    var minPipeLineAltitude = 0;
    var maxPipeLineAltitude = 0;
    var groundAltitudeList = [];
    var pipeLineAltitudeList = [];
    var pipeLineObjectsList = [];
    var flag = true;
    var width = 0;
    var flow = true;
    var strGuidList = [];

    /**
     * 解析结果
     * @param result  服务返回的xml字符串
     * @param layerId   要分析的图层的guid
     * @param type   管线图层的layertype
     * @param customColor   管线的颜色
     * @returns {boolean}
     */
    function parseResult(result, layerId, type, customColor) {
        var json = $.xml2json(result);
        if (json == null || !json.VerticalSectionResult) {
            return;
        }
        var count = parseInt(json.VerticalSectionResult.num);
        if (count < 1) {
            return;
        }
        for (var i = 0; i < count; i++) {
            var Record = null;
            if (count == 1) {
                Record = json.VerticalSectionResult.Record;
            } else {
                Record = json.VerticalSectionResult.Record[i];
            }
            //除去重复数据
            var guid = Record[top.getNameNoIgnoreCase("US_KEY", 1, true)];
            if ($.inArray(strGuidList, guid) > -1) {
                continue;
            }
            strGuidList.push(guid);
            var ID = Record[top.getNameNoIgnoreCase("US_KEY", 1, true)];//管线ID
            var mater = Record[top.getNameNoIgnoreCase("US_PMATER", 1, true)];//材质
            var dataType = StatisticsMgr.getValueByCode("PipeCode", type);//数据类型
            var startDeep = Record[top.getNameNoIgnoreCase("US_SDEEP", 1, true)];//开始埋深
            startDeep = (parseFloat(startDeep)).toFixed(2);
            var endDeep = Record[top.getNameNoIgnoreCase("US_EDEEP", 1, true)];//结束埋深
            endDeep = (parseFloat(endDeep)).toFixed(2);
            var specification = Record[top.getNameNoIgnoreCase("US_SIZE", 1, true)];//规格

            var startID = Record[top.getNameNoIgnoreCase("US_SPT_KEY", 1, true)];//管线开始端点ID
            var endID = Record[top.getNameNoIgnoreCase("US_EPT_KEY", 1, true)];//管线结束端点ID
            var coordinates = Record.Coordinates.split(" ");
            var coordinate1 = coordinates[0].split(",");
            var coordinate2 = coordinates[1].split(",");

            var color = "000000";
            if (top.Stamp.Tools.showMode == "material") {
                color = PipelineStandard.getStandardLineColor(type); // 按材质来
            } else if (top.Stamp.Tools.showMode == "standard") {
                color = PipelineStandard.standardColor(type); // 按国标来
                color = parseInt(color).toString(16);
                color = color.substring(2);
            } else if (top.Stamp.Tools.showMode == "custom") {
                color = parseInt(customColor).toString(16); //按自定义颜色来
                color = color.substring(2);
            }

            var tmp = "000000".substring(color.length, 6);
            color = "#" + color + tmp;


            var pipeLineStartAlt = Record[top.getNameNoIgnoreCase("US_SALT", 1, true)];
            var pipeLineEndAlt = Record[top.getNameNoIgnoreCase("US_EALT", 1, true)];
            var dataStartAlt, dataEndAlt;
            dataStartAlt = parseFloat(pipeLineStartAlt) + parseFloat(startDeep);//地面开始高程
            dataStartAlt = (parseFloat(dataStartAlt)).toFixed(2);
            dataEndAlt = parseFloat(pipeLineEndAlt) + parseFloat(endDeep);//地面结束高程
            dataEndAlt = (parseFloat(dataEndAlt)).toFixed(2);
            var dxPipeLineStartAlt = parseFloat(pipeLineStartAlt).toFixed(2);//add by zhangd 20170829 保证按地形高程显示时下面的数字（地面高程、管线高程等）都显示数据库数据
            var dxPipeLineEndAlt = parseFloat(pipeLineEndAlt).toFixed(2);//add by zhangd 20170829 保证按地形高程显示时下面的数字（地面高程、管线高程等）都显示数据库数据
            if (top.SYSTEMPARAMS.profileAlt == "0") {
                groundStartAlt = parseFloat(pipeLineStartAlt) + parseFloat(startDeep);//地面开始高程
                groundStartAlt = (parseFloat(groundStartAlt)).toFixed(2);
                groundEndAlt = parseFloat(pipeLineEndAlt) + parseFloat(endDeep);//地面结束高程
                groundEndAlt = (parseFloat(groundEndAlt)).toFixed(2);
                pipeLineStartAlt = parseFloat(pipeLineStartAlt).toFixed(2);
                pipeLineEndAlt = parseFloat(pipeLineEndAlt).toFixed(2);
            } else {//地形高程
                groundStartAlt = earth.Measure.MeasureTerrainAltitude(coordinate1[0], coordinate1[1]);
                groundStartAlt = (parseFloat(groundStartAlt)).toFixed(2);
                groundEndAlt = earth.Measure.MeasureTerrainAltitude(coordinate2[0], coordinate2[1]);
                groundEndAlt = (parseFloat(groundEndAlt)).toFixed(2);
                pipeLineStartAlt = (parseFloat(groundStartAlt - endDeep)).toFixed(2); //管线开始高程
                pipeLineEndAlt = (parseFloat(groundEndAlt - startDeep)).toFixed(2);//管线结束高程
            }
            var v3s1 = des_BLH_to_src_xy(layerId, coordinate1);
            var v3s2 = des_BLH_to_src_xy(layerId, coordinate2);
            var length = Math.sqrt(Math.abs(v3s1.X - v3s2.X) * Math.abs(v3s1.X - v3s2.X) + Math.abs(v3s1.Y - v3s2.Y) * Math.abs(v3s1.Y - v3s2.Y));//间距
            length = parseFloat(length.toFixed(5));//截取3位小数位
            tempMinGroundAltitude = Math.min(groundStartAlt, groundEndAlt);
            tempMaxGroundAltitude = Math.max(groundStartAlt, groundEndAlt);
            tempMinPipeLineAltitude = Math.min(pipeLineStartAlt, pipeLineEndAlt);
            tempMaxPipeLineAltitude = Math.max(pipeLineStartAlt, pipeLineEndAlt);
            if (flag) {
                minGroundAltitude = tempMinGroundAltitude;
                maxGroundAltitude = tempMaxGroundAltitude;
                minPipeLineAltitude = tempMinPipeLineAltitude;
                maxPipeLineAltitude = tempMaxPipeLineAltitude;
                flag = false;
            }
            if (minGroundAltitude >= tempMinGroundAltitude) {
                minGroundAltitude = tempMinGroundAltitude;
            }
            if (maxGroundAltitude < tempMaxGroundAltitude) {
                minGroundAltitude = tempMinGroundAltitude;
            }
            if (minPipeLineAltitude >= tempMinPipeLineAltitude) {
                minPipeLineAltitude = tempMinPipeLineAltitude;
            }
            if (maxPipeLineAltitude < tempMaxPipeLineAltitude) {
                maxPipeLineAltitude = tempMaxPipeLineAltitude;
            }
            var pipeLineObj = {};
            pipeLineObj.dataType = dataType;
            pipeLineObj.ID = ID;
            pipeLineObj.startID = startID;
            pipeLineObj.endID = endID;
            pipeLineObj.mater = mater;
            pipeLineObj.width = width;
            pipeLineObj.length = length;
            pipeLineObj.flow = flow;
            pipeLineObj.startCoordX = (v3s1.X).toFixed(2);
            pipeLineObj.startCoordY = (v3s1.Y).toFixed(2);
            pipeLineObj.endCoordX = (v3s2.X).toFixed(2);
            pipeLineObj.endCoordY = (v3s2.Y).toFixed(2);
            pipeLineObj.fillcolor = color;
            pipeLineObj.pipeLineStartAlt = pipeLineStartAlt;
            pipeLineObj.dxPipeLineStartAlt = dxPipeLineStartAlt;
            pipeLineObj.pipeLineEndAlt = pipeLineEndAlt;
            pipeLineObj.dxPipeLineEndAlt = dxPipeLineEndAlt;
            pipeLineObj.groundStartAlt = groundStartAlt;
            pipeLineObj.dataStartAlt = dataStartAlt;
            pipeLineObj.dataEndAlt = dataEndAlt;
            pipeLineObj.groundEndAlt = groundEndAlt;
            pipeLineObj.specification = specification;
            pipeLineObj.startDeep = startDeep;
            pipeLineObj.endDeep = endDeep;
            pipeLineObjectsList.push(pipeLineObj);
        }
        verSectionPipeLine(pipeLineObjectsList);
        getCoordData(pipeLineList);
        if (!IsConnect) {
            var cfm = window.confirm("所选管线不连续，是否继续？");
            if (!cfm) {
                $("#startAnalysis").removeAttr("disabled");
                return false;
            }
        }
        createVerSectionChat();
    }

    //获取地面坐标列表 和 管线坐标列表
    var getCoordData = function (pipeLineList) {
        for (var i = 0; i < pipeLineList.length; i++) {
            var pipeLineObject = pipeLineList[i];
            pipeLineObject.width = width;
            var flow = pipeLineObject.flow;
            var specification = 0;
            if ("" != pipeLineObject.specification && pipeLineObject.specification.toString().indexOf("X") < 0) {
                specification = pipeLineObject.specification / 1000;   //管径
            }
            if (flow) {
                groundAltitudeList.push(pipeLineObject.groundStartAlt);//地面高程起始点x轴坐标
                groundAltitudeList.push(pipeLineObject.width);//地面高程起始点Y轴坐标

                if (top.SYSTEMPARAMS.profileAlt == "0") {
                    pipeLineAltitudeList.push(pipeLineObject.pipeLineStartAlt);
                }
                else {
                    pipeLineAltitudeList.push(pipeLineObject.groundStartAlt - pipeLineObject.startDeep);//管线高程起始点x轴坐标
                }

                pipeLineAltitudeList.push(pipeLineObject.width);//管线高程起始点Y轴坐标
                width = pipeLineObject.width + pipeLineObject.length;
                groundAltitudeList.push(pipeLineObject.groundEndAlt);//地面高程结束点x轴坐标
                groundAltitudeList.push(width);//地面高程结束点Y轴坐标
                if (top.SYSTEMPARAMS.profileAlt == "0") {
                    pipeLineAltitudeList.push(pipeLineObject.pipeLineEndAlt);
                } else {
                    pipeLineAltitudeList.push(pipeLineObject.groundEndAlt - pipeLineObject.endDeep);//管线高程结束点x轴坐标
                }

                pipeLineAltitudeList.push(width);//管线高程结束点Y轴坐标
            } else {
                groundAltitudeList.push(pipeLineObject.groundEndAlt);//地面高程起始点x轴坐标
                groundAltitudeList.push(pipeLineObject.width);//地面高程起始点Y轴坐标

                if (top.SYSTEMPARAMS.profileAlt == "0") {
                    pipeLineAltitudeList.push(pipeLineObject.pipeLineEndAlt);
                }
                else {
                    pipeLineAltitudeList.push(pipeLineObject.groundEndAlt - pipeLineObject.endDeep);//管线高程起始点x轴坐标
                }
                pipeLineAltitudeList.push(pipeLineObject.width);//管线高程起始点Y轴坐标
                width = pipeLineObject.width + pipeLineObject.length;
                groundAltitudeList.push(pipeLineObject.groundStartAlt);//地面高程结束点x轴坐标
                groundAltitudeList.push(width);//地面高程结束点Y轴坐标
                if (top.SYSTEMPARAMS.profileAlt == "0") {
                    pipeLineAltitudeList.push(pipeLineObject.pipeLineStartAlt);
                }
                else {
                    pipeLineAltitudeList.push(pipeLineObject.groundStartAlt - pipeLineObject.startDeep);//管线高程结束点x轴坐标
                }
                pipeLineAltitudeList.push(width);//管线高程结束点Y轴坐标
            }
        }
    };
    //把获取的管线信息进行处理
    var pipeLineList = [];
    var IsConnect = true;//是否连通
    var verSectionPipeLine = function (listPipeline) {
        var ttmpArr = [];
        var startArr = [];
        var endArr = [];
        for (var i = 0; i < listPipeline.length; i++) {
            pipeLineList.push(listPipeline[i]);
            if (i > 0) {
                IsConnect = false;
                for (var j = 0; j < startArr.length; j++) {
                    if (startArr[j] == listPipeline[i].endID) { //坐标全反过来
                        IsConnect = true;
                        listPipeline[j].flow = false;
                        listPipeline[i].flow = false;
                    } else if (startArr[j] == listPipeline[i].startID) { //第一个反过来
                        IsConnect = true;
                        listPipeline[j].flow = false;
                        listPipeline[i].flow = true;
                    } else if (endArr[j] == listPipeline[i].startID) { //不用反
                        IsConnect = true;
                        listPipeline[j].flow = true;
                        listPipeline[i].flow = true;
                    } else if (endArr[j] == listPipeline[i].endID) { //第二个反过来
                        IsConnect = true;
                        listPipeline[j].flow = true;
                        listPipeline[i].flow = false;
                    }
                }
            }
            var sStart = listPipeline[i].startID;
            var sEnd = listPipeline[i].endID;
            startArr.push(sStart);
            endArr.push(sEnd);
        }
    };
    //经纬度转平面坐标
    function des_BLH_to_src_xy(layerId, coordinates) {
        var datum = top.SYSTEMPARAMS.pipeDatum;
        var v3s = datum.des_BLH_to_src_xy(coordinates[0], coordinates[1], coordinates[2]);//经纬度转平面坐标
        return v3s;
    }

    window.getParams = function () {
        var params = {
            pipeLineObjList: pipeLineList,
            gAltList: groundAltitudeList,
            pAltList: pipeLineAltitudeList,
            minG: minGroundAltitude,
            maxG: maxGroundAltitude,
            minP: minPipeLineAltitude,
            maxP: maxPipeLineAltitude
        };
        return params;
    };
    // 创建纵截面图
    function createVerSectionChat() {
        var params = {
            pipeLineObjList: pipeLineList,
            gAltList: groundAltitudeList,
            pAltList: pipeLineAltitudeList,
            minG: minGroundAltitude,
            maxG: maxGroundAltitude,
            minP: minPipeLineAltitude,
            maxP: maxPipeLineAltitude,
            profileAlt: top.SYSTEMPARAMS.profileAlt
        };
        hasClicked = false;
        $("#startAnalysis").attr("disabled", false);
        if (hasSvg()) {//是否支持svg
            openDialog("../../html/analysis/verSectionResult.html", params, 1060, 700);
        } else {
            openDialog("../../html/analysis/verSectionResult2.html", params, 1060, 700);
        }
    }
});