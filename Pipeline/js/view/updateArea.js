/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：管线更新文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth;
var thisMenu = null;//该气泡二级菜单id
var Tools = null;//工具栏的一系列方法
function getEarth(earthObj) {
    earth = earthObj;
    thisMenu = earth.thisMenu;
    Tools = earth.Tools;
    var serverIp = earthObj.params.ip;//服务器IP

    var datum = earthObj.SYSTEMPARAMS.pipeDatum;//管线空间参考坐标
    var projectId = earthObj.SYSTEMPARAMS.project;

    var g_PolygonArr = [];//存放shp数据类的所有面数据数组
    $(function () {
        $("#scrollPipelineDiv").mCustomScrollbar({});
        StatisticsMgr.initPipelineList(projectId, $("#divPipeLineTypeList"));//初始化管线图层列表
        btnOperateEnabled();
        /*
         * 选择shp文件的点击事件
         */
        $("#selectImg").click(function () {
            var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "shape文件(*.shp)|*.shp|dxf文件(*.dxf)|*.dxf|dwg文件(*.dwg)|*.dwg");
            if (filePath == "") {
                return;
            }
            $("#selArea").attr("value", filePath);
            btnOperateEnabled();
            addPolygonArr(filePath);
        });

        //管线图层点击
        $("#divPipeLineTypeList").click(function () {
            btnOperateEnabled();
        });

        /*
         * 更新按钮点击事件
         */
        $("#btnUpdate").click(function () {
            $("#btnUpdate").attr("disabled", true);
            updateStatus = true;//确定最后是否为true判定是否更新成功
            runTimes = 0;
            UpdateArea();
        });

        /*
         * 取消按钮点击事件
         */
        $("#btnCancel").click(function () {
            if (Tools && thisMenu) {
                Tools.singleStyleCancel(thisMenu);
            }
            if (earth.htmlBallon) {
                earth.htmlBallon.DestroyObject();
            }
        });
    });

    /*
     * 根据shp文件，获取该图层里面的所有面数据，存放在全局变量g_PolygonArr数组中
     */
    function addPolygonArr(filePath) {
        var shapePath = filePath;
        if (shapePath) {
            var pathStr = shapePath.split(".");
            var layerType = pathStr[pathStr.length - 1];//文件后缀名shp dwg dxf
            //载入数据处理对象
            dataPro = document.getElementById("dataProcess");
            dataPro.Load();
            var ogrDataProcess = dataPro.OGRDataProcess;
            var driver;
            switch (layerType) {
                case "shp":
                    driver = ogrDataProcess.GetDriverByType(44);
                    break;
                case "dwg":
                    driver = ogrDataProcess.GetDriverByType(8);
                    break;
                case "dxf":
                    driver = ogrDataProcess.GetDriverByType(7);
                    break;
                default:
                    break;
            }
            ;

            //SHAPE的路径
            var readData = driver.Open(shapePath, 0);
            if (readData == null) {
                return;
            }
            var layerNum = readData.GetLayerCount();
            if (layerNum == null) {
                return;
            }
            g_PolygonArr = [];//面数据数组初始化
            for (var i = 0; i < layerNum; i++) {
                var readLayer = readData.GetLayer(i);
                var type = 0;
                var featureNum = readLayer.GetFeatureCount();
                for (var j = 0; j < featureNum; j++) {
                    //获取feature
                    var feature = readLayer.GetFeature(j);
                    type = feature.GetGeometryType();
                    //获取feature对应的属性字段
                    var featureDefn = feature.GetFeatureDefn();
                    type = Number(type.toString(16));
                    //获取空间信息
                    var v3s;
                    var guid = earth.Factory.CreateGUID();
                    var element;
                    //判断几何类型 参见SEWkbGeometryType枚举类型
                    if (type === 3 || type === 403) { // 面，来源于stamp的“导入shp”功能
                        var poly = feature.GetPolygon();
                        v3s = transformPolygon(poly);
                        element = earth.Factory.CreateElementPolygon(guid, "polygon");
                        element.FillStyle.FillColor = parseInt("0x" + "3200ff00");
                        element.LineStyle.LineColor = parseInt("0x" + "ffffff00");
                        element.SetExteriorRing(v3s);
                        g_PolygonArr.push(element);
                    }
                }
            }
        }
    }

    /*
     * 操作按钮是否禁用
     */
    function btnOperateEnabled() {
        var pLength = $("#divPipeLineTypeList input:checkbox[checked=checked]").length;
        var selArea = $("#selArea").val();
        if (pLength > 0 && selArea != null && selArea != "") {
            $("#btnUpdate").removeAttr("disabled");
        }
        else {
            $("#btnUpdate").attr("disabled", true);
        }
    };

    /*
     * 点击确定按钮响应事件，更新g_PolygonArr数组（很多平面区域）内的管线
     */
    function UpdateArea() {
        if(!g_PolygonArr.length){//说明没有图层或者是
            alert("选择的shp数据不符合要求，请重新选择shp!");
            return;
        }
        $("#loadingImg").addClass("showImg");
        var layers = $("#divPipeLineTypeList input:checkbox[checked=checked]");
        //循环每个图层，每个平面区域，更新管线
        for (var i = 0; i < layers.length; i++) {
            for (var j = 0; j < g_PolygonArr.length; j++) {
                publish_pipeline(layers[i].value, g_PolygonArr[j]);//使用图层guid更新管线
            }
        }
    }

    /*
     * 更新管线
     */
    function publish_pipeline(guid, polygon) {
        var ipAddr = serverIp.split("//");
        if (ipAddr.length < 2) {
            return;
        }
        var version = $("#version").val();
        if (version == "") {
            // var httpurl = serverIp + "/se_pipeline_publish_tool?type=areapublish&dbip=" + ipAddr[1] + "&tablename=" + tablename;//使用ip+表名更新
            var httpurl = serverIp + "/se_pipeline_publish_tool?type=areapublish&guid=" + guid;//使用图层guid更新管线
        } else {
            // var httpurl = serverIp + "/se_pipeline_publish_tool?type=areapublish&dbip=" + ipAddr[1] + "&tablename=" + tablename+"&version="+version;//使用ip+表名更新
            var httpurl = serverIp + "/se_pipeline_publish_tool?type=areapublish&guid=" + guid + "&version=" + version;//使用图层guid更新管线
        }
        var configXml = "<xml><locations>";
        var vecs = polygon.GetExteriorRing();
        var firstPoint = {};
        for (var i = 0; i < vecs.Count; i++) {
            var vec = vecs.Items(i);
            var xyPoint = datum.des_BLH_to_src_xy(vec.X, vec.Y, 0.0);
            configXml += "<location>" + xyPoint.X + "," + xyPoint.Y + "</location>";
            if (i == 0) {//防止出现非闭合环路的面
                firstPoint.x = xyPoint.x;

                firstPoint.y = xyPoint.y;
            }
            if (i == vecs.Count - 1) {
                if (xyPoint.x != firstPoint.x || xyPoint.y != firstPoint.y) {
                    configXml += "<location>" + firstPoint.x + "," + firstPoint.y + "</location>";
                }
            }
        }
        configXml += "</locations></xml>";

        modifyPostAsync(httpurl, configXml);
    };
    var updateStatus = true;//确定最后是否为true判定是否更新成功
    var runTimes = 0;

    /*
     * 调用post服务，更新管线
     */
    function modifyPostAsync(url, xmldoc) {
        var filePath = earth.Environment.RootPath + "temp\\temp_updateArea";
        var postFilePath = earth.Environment.RootPath + "temp\\temp_updateArea.xml";
        earth.UserDocument.DeleteXmlFile(postFilePath);
        var layersLen = $("#divPipeLineTypeList input:checkbox[checked=checked]").length;
        var geoLen = g_PolygonArr.length;
        var totalRunTimes = layersLen * geoLen;
        earth.UserDocument.SaveXmlFile(filePath, xmldoc);//保存XML文件
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            runTimes++;
            if (pRes.ExcuteType != 23) {
                updateStatus = false;
            }

            if (runTimes == totalRunTimes) {
                $("#loadingImg").removeClass("showImg");
                if (updateStatus) {
                    alert("更新完成");
                    if (Tools && thisMenu) {
                        Tools.singleStyleCancel(thisMenu);
                    }
                    if (earth.htmlBallon != null) {
                        earth.htmlBallon.DestroyObject();
                    }
                } else {
                    alert("更新失败");
                    $("#loadingImg").removeClass("showImg");
                }
            }
        }
        earth.DatabaseManager.PostFile(postFilePath, url);//将保存的XML文件路径和url传入
    }

    /* 
     * 对线数据进行空间数据转换
     */
    function transformPolygon(poly) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine);
        var v3s = earth.Factory.CreateVector3s();
        for (var k = 0; k < wInerLine.length; k++) {
            var v = wInerLine[k];
            var v3 = earth.Factory.CreateVector3();
            v3.X = v.X;
            v3.Y = v.Y;
            v3.Z = v.Z;
            v3s.AddVector(v3);
        }
        return v3s;
    };

    /*
     * 根据line转换坐标
     */
    function transformLinearRing(line) {
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++) {
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point);
            result.push(rawPoint);
        }
        return result;
    }

    /* 
     * 对点数据进行空间数据转换 平面转经纬度
     */
    function TransformPoint(point) {
        var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    }
}