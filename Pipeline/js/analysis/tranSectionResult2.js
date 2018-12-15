/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：横断面分析结果显示文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var gCanvas = document.getElementById("gCanvas");
var params = window.dialogArguments;
var groundAltList = params.gAltList;//[地面高程,间距]
var earth = params.earthObj;
var elementLine = params.elementLine;
var clientWidth = 600;
var clientHeight = 1000;
var size = 1;

function clearLine() {
    earth.ToolManager.SphericalObjectEditTool.Browse();
    if (elementLine) {
        earth.DetachObject(elementLine);
    }
}

// Y轴竖线
function createYLine() {
    var yLine = document.createElement("v:line");
    yLine.style.zIndex = 5;
    yLine.StrokeWeight = 1;
    yLine.From = "0," + 125 * size;
    yLine.To = 450 * size + "," + 125 * size;
    gCanvas.appendChild(yLine);
}

// Y轴竖线刻度
function createYTick() {
    var start = 250 * size, step = 50 * size, iTick = 0, yTick = null;
    while (iTick <= 4) {
        yTick = document.createElement("v:line");
        yTick.style.zIndex = 5;
        yTick.StrokeWeight = 1;
        yTick.From = (start + iTick * step) + "," + 125 * size;
        yTick.To = (start + iTick * step) + "," + 130 * size;
        gCanvas.appendChild(yTick);
        iTick += 1;
    }
}

// Y轴竖线刻度值
function createYTickValue(maxGroundAltitude, minPipeLineAltitude) {
    var textPoint = 0;
    var altitude = (parseFloat(Math.abs((maxGroundAltitude - minPipeLineAltitude) / 4))).toFixed(2);
    var minValue = (parseFloat(minPipeLineAltitude)).toFixed(2);
    for (var i = 0; i <= 4; i++) {
        var py = i * 50 + 110;
        textPoint = parseFloat(altitude) * (i) + parseFloat(minValue);
        textPoint = (textPoint).toFixed(2);
        var newShape = document.createElement("<v:shape style='position:absolute;left:" + (py - 50 + 1 - 6) * size + "px;top:" + 85 * size + "px;WIDTH:" + 200 * size + "px; text-align:right;HEIGHT:" + 35 * size + "px;z-index:0' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
        var newText = document.createElement("<v:textbox id='ty" + textPoint + "' inset='3pt,0pt,3pt,0pt' style='text-align:right;font-size:8pt;v-text-anchor:bottom-right-baseline'></v:textbox>");
        newText.innerHTML = textPoint;
        newShape.insertBefore(newText);
        gCanvas.insertBefore(newShape);
    }
}

// 表格标题
function createTableTitle() {
    var titles = ["埋深(m)", "规格(mm)", "间距(m)", "管线高程", "地面高程"];
    var i = 0;
    var rectBox = null, txtPath = null;
    while (i < titles.length) {
        rectBox = document.createElement("v:rect");
        rectBox.style.left = 0 + i * 40 * size;
        rectBox.style.top = 20 * size;
        rectBox.style.width = 40 * size;
        rectBox.style.height = 105 * size;
        rectBox.className = "rectTitle";
        txtPath = document.createElement("v:textbox");
        txtPath.innerText = titles[i];
        rectBox.appendChild(txtPath);
        gCanvas.appendChild(rectBox);
        i += 1;
    }
}
// 管线剖面点
function createPipeProfile(pipeLineObj, x, y, lengthValue, yy, type) {
    var r = 5;
    var circle = null;
    if (type === "circle") {
        circle = document.createElement("v:oval");
    } else {
        circle = document.createElement("v:Rect");
    }
    circle.style.left = x * size - r;
    circle.style.top = y * size - r;
    circle.style.zIndex = 5;
    circle.style.width = r * 2;
    circle.style.height = r * 2;
    circle.style.cursor = "pointer";
    circle.FillColor = pipeLineObj.fillcolor;
    circle.Stroked = "f";
    circle.onmouseenter = function () {
        if (params.profileAlt != "0") {
            var boxGroundAlt = pipeLineObj.dataAltitude;
        } else {
            var boxGroundAlt = pipeLineObj.groundAltitude;
        }
        var divStr = '<table align="right" class="pipeProfile">';
        divStr += '<tr class="colClass1"><td class="rightTd">数据类型：</td><td>' + pipeLineObj.dataType + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">编号：</td><td id="id">' + pipeLineObj.ID + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">规格：</td><td>' + pipeLineObj.specification + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">材质：</td><td>' + pipeLineObj.mater + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">横坐标：</td><td>' + pipeLineObj.coordX + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">纵坐标：</td><td>' + pipeLineObj.coordY + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">管线高程：</td><td>' + pipeLineObj.x + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">地面高程：</td><td>' + boxGroundAlt + '</td></tr>';
        divStr += '</table>';
        $("#divHover").html(divStr);
        $("#divHover").show();

        if ($(this).offset().left + 15 + $("#divHover").width() > 1000 * size + 60) {
            $("#divHover").css("left", $(this).offset().left - 5 - $("#divHover").width());
        } else {
            $("#divHover").css("left", $(this).offset().left + 15);
        }
        if ($(this).offset().top + 15 + $("#divHover").height() > 600 * size + 100) {
            $("#divHover").css("top", $(this).offset().top - 5 - $("#divHover").height());
        } else {
            $("#divHover").css("top", $(this).offset().top + 15);
        }

    };
    circle.onmouseout = function () {
        $("#divHover").hide();
    }
    circle.onclick = function () {
        if (params.profileAlt != "0") {
            var boxGroundAlt = pipeLineObj.dataAltitude;
        } else {
            var boxGroundAlt = pipeLineObj.groundAltitude;
        }
        var x = event.screenX - 100;
        var y = event.screenY - 250;
        window.showModalDialog("MessageBox.html?t=" + pipeLineObj.dataType + "&i=" + pipeLineObj.ID + "&s=" + pipeLineObj.specification + "&m=" + pipeLineObj.mater +
            "&x=" + pipeLineObj.coordX + "&y=" + pipeLineObj.coordY + "&p=" + pipeLineObj.x + "&g=" + boxGroundAlt
            , "_blank", "dialogWidth=220px;dialogHeight=220px,top=" + y + ",left=" + x + ",toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no,status=no");
    };
    gCanvas.appendChild(circle);
    var plotLine = document.createElement("v:line");
    plotLine.style.zIndex = 4;
    plotLine.Stroked = "true";
    plotLine.StrokeWeight = 1;
    var stroke = document.createElement("v:stroke");
    stroke.DashStyle = "dash";
    plotLine.appendChild(stroke);
    plotLine.From = x * size + "," + y * size;
    plotLine.To = "0" + "," + y * size;
    gCanvas.appendChild(plotLine);

    insertDataToTable(pipeLineObj, y, lengthValue, yy);
}

//向表格中插入数据
var tmpLength = 0;//间距的第一个数据不需要加入
var yyy = 0;
function insertDataToTable(pipeLineObj, y, lengthValue, yy) {
    //地面高程
    var groundAlt = pipeLineObj.groundAltitude;
    var newShape = document.createElement("<v:shape style='position:absolute;left:" + 160 * size + "px;top:" + (y * size - 13) + "px;WIDTH:" + 72 * size + "px;HEIGHT:" + 70 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty0' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3); '></v:textbox>");
    newShape.insertBefore(newText);
    if (params.profileAlt != "0") {//修改如果是地形高程显示方式也同样使用数据高程
        newText.innerHTML = pipeLineObj.dataAltitude;
    } else {
        newText.innerHTML = groundAlt;
    }

    //管线高程
    var pipeLineAlt = pipeLineObj.x;
    var newShape = document.createElement("<v:shape style='position:absolute;left:" + 120 * size + "px;top:" + (y * size - 13) + "px;WIDTH:" + 72 * size + "px;HEIGHT:" + 70 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty1' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = pipeLineAlt;

    //间距
    if (tmpLength == 0) {
        tmpLength = 1;
    } else {
        var length = Math.abs(parseFloat(lengthValue));
        length = (length).toFixed(2);//(yy+yyy)/2
        var newShape = document.createElement("<v:shape style='position:absolute;left:" + 30 * size + "px;top:" + ((y + yyy) / 2 - 10) * size + "px;WIDTH:" + 78 * size + "px;HEIGHT:" + 70 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty2' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = length;

    }
    yyy = y;
    //规格
    var specification = pipeLineObj.specification;
    specification = specification || "";
    if (specification.indexOf("X") == -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:" + 40 * size + "px;top:" + (y * size - 13) + "px;WIDTH:" + 78 * size + "px;HEIGHT:" + 70 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;
    } else if (specification.indexOf("X") > -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:" + 30 * size + ";top:" + (y * size - 13) + "px;WIDTH:" + 40 * size + "px;HEIGHT:" + 100 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;
    }

    //埋深
    var deep = pipeLineObj.deep;
    var newShape = document.createElement("<v:shape style='position:absolute;left:0;top:" + (y * size - 13) + "px;WIDTH:" + 78 * size + "px;HEIGHT:" + 70 * size + "px;z-index:8' coordsize='" + 1000 * size + "," + 600 * size + "' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty4' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = deep;
}

//创建所有管线剖面
function createPipeProfiles(ptsWithColor, minX, maxX, minY, maxY, lengthListArray) {
    var i = 0;
    var x = null;
    var y = null;
    var yy = null;
    var lineColor = null;
    var lineType = null;
    while (i < ptsWithColor.length) {
        var specification = 0;
        if (ptsWithColor[i].specification && ptsWithColor[i].specification.toString().indexOf("X") < 0) {
            specification = ptsWithColor[i].specification / 1000;   //管径
        }
        if ((maxX - minX) != 0) {
            ratioX = 200 / (maxX - minX);
            if (params.profileAlt == "0") {//数据高程
                x = (ptsWithColor[i].x - minX) * ratioX + 250;
            }
            else {//地形高程
                x = (groundAltList[i * 2] - ptsWithColor[i].deep - minX) * ratioX + 250;
            }
            if (x > 450) {
                x = 450;
            } else if (x < 250) {
                x = 250;
            }
        } else {
            if (params.profileAlt == "0") {//数据高程
                x = ptsWithColor[i].x - minX + 250;
            }
            else {//地形高程
                x = groundAltList[i * 2] - ptsWithColor[i].deep - minX + 250;
            }
            if (x > 450) {
                x = 450;
            } else if (x < 250) {
                x = 250;
            }
        }
        if ((maxY - minY) != 0) {
            ratioY = 800 / (maxY - minY);
            y = (ptsWithColor[i].y - minY) * ratioY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = (ptsWithColor[i] - minY) * ratioY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        } else {
            y = ptsWithColor[i].y - minY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = ptsWithColor[i] - minY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        }
        var tag = ptsWithColor[i].specification;
        if (isNaN(ptsWithColor[i].specification)) {
            lineType = "polygon";
        } else {
            lineType = "circle";
        }
        createPipeProfile(ptsWithColor[i], x, y, lengthListArray[i], yy, lineType);
        i += 1;
    }
}

// 地形剖面线
function createTerrainProfile(pts) {
    var tempPts = pts.toString().split(",");
    var arr = new Array();
    var line = document.createElement("v:polyline");
    line.style.zIndex = 100;
    line.StrokeWeight = 1;
    line.points = pts.toString();
    gCanvas.appendChild(line);
}

$(function () {
    var groundCoordList = [];
    var pipeLineAltList = params.pAltList;//管线信息数组 需要排序 按照间距的大小排序
    var minLength = params.minL;//最小间距
    var maxLength = params.maxL;//最大间距
    var minGroundAltitude = params.minG;//最小地面高程
    var maxGroundAltitude = params.maxG;//最大地面高程
    var minPipeLineAltitude = params.minP;//最小管线高程
    var maxPipeLineAltitude = params.maxP;//最大管线高程
    var minX = Math.min(minPipeLineAltitude, minGroundAltitude);//高程最小值 绘制X注
    var maxX = Math.max(maxPipeLineAltitude, maxGroundAltitude);//高程最大值
    var minY = minLength;//间距作为Y注绘图
    var maxY = maxLength;
    //根据length重新排序
    var orderGroundCoordListByLength = function (groundCoordList) {
        var gCoordList = [];
        var coordListArr = [];
        for (var i = 0; i < groundCoordList.length; i++) {
            var temp;
            for (var j = i + 1; j < groundCoordList.length; j++) {
                if (parseFloat(groundCoordList[i][1]) >= parseFloat(groundCoordList[j][1])) {
                    temp = groundCoordList[i];
                    groundCoordList[i] = groundCoordList[j];
                    groundCoordList[j] = temp;
                }
            }
            gCoordList.push(groundCoordList[i]);
        }
        for (var k = 0; k < gCoordList.length; k++) {
            coordListArr.push(gCoordList[k][0]);
            coordListArr.push(gCoordList[k][1]);
        }
        return coordListArr;
    };
    var groundAlt = null;
    var ratioX = null;
    var ratioY = null;
    //将坐标变换后的地面高程坐标转换成数组形式
    var turnGroundCoordListToArray = function (groundAltList) {
        for (var i = 0; i < groundAltList.length; i++) {
            var groundCoord = [];
            if ((maxX - minX) != 0) {
                ratioX = 200 / (maxX - minX);
                groundAlt = ratioX * (groundAltList[i] - minX) + 250;
                if (groundAlt > 450) {
                    groundAlt = 450;
                } else if (groundAlt < 250) {
                    groundAlt = 250;
                }
            } else {
                groundAlt = groundAltList[i] + 250;
                if (groundAlt > 450) {
                    groundAlt = 450;
                } else if (groundAlt < 250) {
                    groundAlt = 250;
                }
            }
            groundCoord.push(groundAlt);
            i++;
            if ((maxY - minY) != 0) {
                ratioY = 800 / (maxY - minY);
                groundAlt = ratioY * (groundAltList[i] - minY) + 150;
                if (groundAlt > 950) {
                    groundAlt = 950;
                } else if (groundAlt < 150) {
                    groundAlt = 150;
                }
            } else {
                groundAlt = groundAltList[i] + 150;
                if (groundAlt > 950) {
                    groundAlt = 950;
                } else if (groundAlt < 150) {
                    groundAlt = 150;
                }
            }
            groundAlt = groundAlt * size;
            groundCoord.push(groundAlt);
            groundCoordList.push(groundCoord);
        }
        return groundCoordList;
    };

    //将高程坐标字符串转换成数组
    var getAllLengthArray = function (groundAltList) {
        var tempArray = [];
        for (var i = 1; i < groundAltList.length; i = i + 2) {
            tempArray.push(parseFloat(groundAltList[i]));
        }
        var tmp = null;
        for (var j = 0; j < tempArray.length; j++) {
            for (var k = 0; k < tempArray.length; k++) {
                if (parseFloat(tempArray[j]) < parseFloat(tempArray[k])) {
                    tmp = tempArray[j];
                    tempArray[j] = tempArray[k];
                    tempArray[k] = tmp;
                }
            }
        }
        //两条管线之间间距值
        for (var k = tempArray.length - 1; k > 0; k--) {
            tempArray[k] = tempArray[k] - tempArray[k - 1];
        }
        return tempArray;
    };

    //通过间距给管线排序 由近及远
    var getAllPipelineSort = function (pipelineList) {
        var arr = pipelineList;
        var tempArray = [];
        for (var i = 0; i < pipelineList.length; i++) {
            tempArray.push(parseFloat(pipelineList[i].y));
        }
        for (var j = 0; j < tempArray.length - 1; j++) {
            var tmp = null;
            var temp2 = null;
            for (var k = j + 1; k < tempArray.length; k++) {
                if (tempArray[j] > tempArray[k]) {
                    tmp = arr[j];
                    arr[j] = arr[k];
                    arr[k] = tmp;

                    temp2 = tempArray[j];
                    tempArray[j] = tempArray[k];
                    tempArray[k] = temp2;
                }
            }
        }
        return arr;
    }

    turnGroundCoordListToArray(groundAltList);
    var coordListArr = orderGroundCoordListByLength(groundCoordList);
    var palist = getAllPipelineSort(pipeLineAltList);
    var lengthListArray = getAllLengthArray(groundAltList);//间距
    zoom();
    function zoom() {
        $("#gCanvas").empty();
        $("#gCanvas").html('<v:rect id="gRect" style="width:' + 600 * size + ';height:' + 1000 * size + ';" strokeweight="2" /><v:group id="gGroup" style="top:' + 20 * size + ';width:' + 200 * size + '; height:' + 950 * size + ';" coordsize="' + 200 * size + ',' + 950 * size + '"><v:rect id="gRectInner" style="z-index:4;width:' + 200 * size + ';height:' + 950 * size + ';" /><v:line strokeweight="1" style="z-index:5;" from="' + 40 * size + ',0" to="' + 40 * size + ',' + 950 * size + '" /><v:line strokeweight="1" style="z-index:5;" from="' + 80 * size + ',0" to="' + 80 * size + ',' + 950 * size + '" /><v:line strokeweight="1" style="z-index:5;" from="' + 120 * size + ',0" to="' + 120 * size + ',' + 950 * size + '" /><v:line strokeweight="1" style="z-index:5;" from="' + 160 * size + ',0" to="' + 160 * size + ',' + 950 * size + '" /></v:group>');
        tmpLength = 0;
        createYLine();
        createYTick();
        createTableTitle();
        if (palist.length > 1) {
            var coordListArr2 = [];
            for (var i = 0; i < coordListArr.length; i++) {
                coordListArr2.push(coordListArr[i] * size);
            }
            createTerrainProfile(coordListArr2);
        } else if (palist.length == 1) {
            var coordListArr2 = [];
            for (var i = 0; i < coordListArr.length; i++) {
                coordListArr2.push(coordListArr[i] * size);
            }
            coordListArr2.push(coordListArr2[0]);
            coordListArr2.push(950);
            createTerrainProfile(coordListArr2);
        }
        createPipeProfiles(palist, minX, maxX, minY, maxY, lengthListArray);
        createYTickValue(maxX, minX);
    }

    $("#btnZoomBig").click(function () {
        if (size >= 5) {
            alert("已是最大比例，无法放大");
            return;
        }
        size += 0.5;
        zoom();
    });

    $("#btnZoomSmall").click(function () {
        if (size <= 1) {
            alert("已是最小比例，无法缩小");
            return;
        }
        size -= 0.5;
        zoom();
    });
});