/**
 * Table Plugin (search, sort)
 * Buat element <div></div>
 * attribute
 * id = (mandatory) "tbl-container-plugin"
 * data-tbl-content-url = (mandatory) (url) URL to content web service
 * data-tbl-header-url = (mandatory) (url) URL to table header web service
 * data-tbl-add-url = (get variable) id_user=?&id_cabang=?
 */
var colCount = 0;
var orderBy = 0;
var orderDirection = "ASC";
var searchKey = "";
var page = 1;
var urlAdd = "";
var content = [];
var tblHeaderCtrl;
var contentCtrl;
var buttonList = [
    {
        style:'cursor:pointer;font-size:large',
        data_toggle:'modal',
        class:'detail_button text-success md-eye',
        data_target:'#detail_modal',
        onclick:'load_detail_content()'
    },
    {
        style:'cursor:pointer;font-size:large',
        data_toggle:'modal',
        class:'edit_button text-primary md-edit',
        data_target:'#update_modal',
        onclick:'load_edit_content()'
    },
    {
        style:'cursor:pointer;font-size:large',
        data_toggle:'modal',
        class:'delete_button text-danger md-delete',
        data_target:'#delete_modal',
        onclick:'load_delete_content()'
    }
];
var unauthorizedButton = [];
var excelUrl = "";

init_tbl_plugin();
function init_tbl_plugin(){
    init_tbl_display();
    present_tbl_header();
    func_refresh();
}
function init_tbl_display(){
    var html = "";
    if(excelUrl){
        var excel = `
        <div class = "form-group">
            <a href = "${excelUrl}" class = 'text-success'><i class = 'md-assignment-returned'></i> Download Excel</a><br/><br/>
        </div>`;
        html += excel;
    }
    var search = `
    <div class = "form-group">
        <h5>Search Data Here</h5>
        <input id = "search_box" placeholder = "Search data here..." type = "text" class = "form-control input-sm " onkeyup = "func_search()" style = "width:25%">
    </div>
    `;
    html += search;

    var table = `
    <nav aria-label="Page navigation example">
        <ul class="pagination justify-content-center pagination_container">
        </ul>
    </nav>
    <div class = "table-responsive">
        <table class = "table table-bordered table-striped" id = "table_container">
            <thead id = "col_title_container">
            </thead>
            <tbody id = "content_container" class = "content_container">
            </tbody>
        </table>
    </div>
    <nav aria-label="Page navigation example">
        <ul class="pagination justify-content-center pagination_container">
        </ul>
    </nav>`;
    html += table;
    document.getElementById("tbl-container-plugin").insertAdjacentHTML("afterend",html);
    contentCtrl = document.getElementById("tbl-container-plugin").getAttribute("data-tbl-content-url");
    if(!contentCtrl){
        alert("data-tbl-content-url attribute is undefined");
        return 0;
    }
    tblHeaderCtrl = document.getElementById("tbl-container-plugin").getAttribute("data-tbl-header-url");
    if(!tblHeaderCtrl){
        alert("data-tbl-header-url attribute is undefined");
        return 0;
    }
    urlAdd = "&"+document.getElementById("tbl-container-plugin").getAttribute("data-tbl-add-url");
    if(!urlAdd){
        urlAdd = "";
    }
    document.getElementById("tbl-container-plugin").remove();
}
function init_additional_button(additionalButton){
    if(!additionalButton){
        alert("Additional button array is not defined");
        return 0;
    }
    buttonList = buttonList.concat(additionalButton);
}
function init_unauthorized_button(unauthorizedButton){
    if(!unauthorizedButton){
        alert("Unauthorized button array is not defined");
        return 0;
    }
    unauthorizedButton = unauthorizedButton;
}
function present_tbl_header(){
    if(tblHeaderCtrl){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200){
                var response = JSON.parse(this.responseText);
                var html = "";
                if(response["status"] == "SUCCESS"){
                    colCount = response["content"].length+1; //sama col action
                    html += "<tr>";
                    for(var a = 0; a<response["content"].length; a++){
                        html += `
                        <th id = 'col${a}' style = 'cursor:pointer' onclick = 'func_sort(${a})' class = 'text-center align-middle'>${response["content"][a]["col_name"]}`;
                        if(a == 0){
                            html += " <span class='badge badge-primary align-top' id = 'orderDirection'>A-Z</span>";
                        }
                        html += "</th>";
                    }
                    html += "<th class = 'text-center align-middle action_column'>Action</th>";
                    html += "</tr>";
                }
                else{
                    html += "<tr>";
                    html += "<th class = 'align-middle text-center'>Columns is not defined</th>";
                    html += "</tr>";
                }
                document.getElementById("col_title_container").innerHTML = html;
            
            }
            else{
                var html = "<tr>";
                html += "<th class = 'align-middle text-center'>Columns is not defined</th>";
                html += "</tr>";
                document.getElementById("col_title_container").innerHTML = html;
            }
        }
        xhttp.open("GET",tblHeaderCtrl,true);
        xhttp.send();
    }
}
function func_refresh(req_page = 1) {
    if(contentCtrl){
        page = req_page;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(this.readyState == 4 && this.status == 200){
                var response = JSON.parse(this.responseText);
                if(response["status"].toLowerCase() == "success"){
                    present_tbl_content(response);
                    present_pagination(response["page"]);
                }
            }
        }
        xhttp.open("GET",contentCtrl+`?orderBy=${orderBy}&orderDirection=${orderDirection}&page=${page}&searchKey=${searchKey}${urlAdd}`,true);
        xhttp.send();
    }
}
function present_tbl_content(content){
    console.log(content);
    var html = "";
    if(content["content"].length > 0){
        for(var a = 0; a<content["content"].length; a++){
            html += "<tr>";
            for(var b = 0; b<content["key"].length; b++){
                if(content["content"][a][content["key"][b]] == null){
                    content["content"][a][content["key"][b]] = "";
                }
                if(content["key"][b].toLowerCase() == "status"){
                    html += present_data_using_badges(content["content"][a][content["key"][b]]);
                }
                else{
                    html += "<td class = 'align-middle text-center'>"+content["content"][a][content["key"][b]]+"</td>";
                }
            }
            html += present_action_button(a);
            html += "</tr>";
        }
    }
    else{
        html += "<tr>";
        html += "<td colspan = "+colCount+" class = 'align-middle text-center'>No Records Found</td>";
        html += "</tr>";
    }

    document.getElementById("content_container").innerHTML = html;
    remove_unauth_button();
}
function present_data_using_badges(data){
    var html = "";
    switch(data.toLowerCase()){
        case "aktif":
        html += `
            <td class = 'align-middle text-center'>
                <span class="badge badge-success align-top" id = "orderDirection">${data.toUpperCase()}</span>
            </td>`;
        break;
        case "konfirmasi":
        html += `
            <td class = 'align-middle text-center'>
                <span class="badge badge-primary align-top" id = "orderDirection">${data.toUpperCase()}</span>
            </td>`;
        break;
        case "selesai":
        html += `
            <td class = 'align-middle text-center'>
                <span class="badge badge-primary align-top" id = "orderDirection">${data.toUpperCase()}</span>
            </td>`;
        break;
        case "diterima":
        html += `
            <td class = 'align-middle text-center'>
                <span class="badge badge-primary align-top" id = "orderDirection">${data.toUpperCase()}</span>
            </td>`;
        break;
        default:
        html += `
            <td class = 'align-middle text-center'>
                <span class="badge badge-danger align-top" id = "orderDirection">${data.toUpperCase()}</span>
            </td>`;
        break;
    }
    return html;
}
function present_action_button(row){
    var addtnl = ""; 
    var html = "";
    for(var add = 0; add<buttonList.length; add++){
        var props = "";
        for (var key in buttonList[add]) {
            if (buttonList[add].hasOwnProperty(key)) {   
                key_final = key.replace("_","-");
                props += " "+key_final+"='"+buttonList[add][key]+"'";
            }
        }
        addtnl += `  <i data-row-id = '${row}' ${props}></i>`;
    }
    html += `
    <td class = 'align-middle text-center action_column'>
        ${addtnl}
    </td>`;
    return html;
}
function remove_unauth_button(){
    if(unauthorizedButton){
        for(var a = 0; a<unauthorizedButton.length; a++){
            var elemList = document.getElementsByClassName(unauthorizedButton[a]);
            var length = elemList.length;
            for(var b = 0; b<length; b++){
                elemList[0].remove();
            }
        }
    }
}
function present_empty_content(){

    var html = "";
    html += "<tr>";
    html += "<td colspan = "+colCount+" class = 'align-middle text-center'>No Records Found</td>";
    html += "</tr>";
    document.getElementById(tblId).innerHTML = html;
    
    html = "";
    html += '<li class="page-item"><a class="page-link" style = "cursor:not-allowed"><</a></li>';
    html += '<li class="page-item"><a class="page-link" style = "cursor:not-allowed">></a></li>';
    document.getElementById(paginationClass).innerHTML = html;
}
function present_pagination(page_rules){
    html = "";
    if(page_rules["previous"]){
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["before"]})"><</a>
        </li>`;
    }
    else{
        html += `
        <li class="page-item">
            <a class="page-link" style = "cursor:not-allowed"><</a>
        </li>`;
    }
    if(page_rules["first"]){
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["first"]})">${page_rules["first"]}</a>
        </li>`;
        html += `
        <li class="page-item">
            <a class="page-link">...</a>
        </li>`;
    }
    if(page_rules["before"]){
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["before"]})">${page_rules["before"]}</a>
        </li>`;
    }
    html += `
        <li class="page-item active">
            <a class="page-link" onclick = "func_refresh(${page_rules["current"]})">${page_rules["current"]}</a>
        </li>`;
    if(page_rules["after"]){
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["after"]})">${page_rules["after"]}</a>
        </li>`;
    }
    if(page_rules["last"]){
        html += `
        <li class="page-item">
            <a class="page-link">...</a>
        </li>`;
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["last"]})">${page_rules["last"]}</a>
        </li>`;
    }
    if(page_rules["next"]){
        html += `
        <li class="page-item">
            <a class="page-link" onclick = "func_refresh(${page_rules["after"]})">></a>
        </li>`;
    }
    else{
        html += `
        <li class="page-item">
            <a class="page-link" style = "cursor:not-allowed">></a>
        </li>`;
    }
    var classElem = document.getElementsByClassName("pagination_container");
    for(var a = 0; a<classElem.length; a++){
        classElem[a].innerHTML = html;
    }
}
function func_sort(colNum){
    if(parseInt(colNum) != orderBy){
        orderBy = colNum; 
        orderDirection = "ASC";
        var orderDirectionHtml = ' <span class="badge badge-primary align-top" id = "orderDirection">A-Z</span>';
        $("#orderDirection").remove();
        $("#col"+colNum).append(orderDirectionHtml);
    }
    else{
        var direction = $("#orderDirection").text();
        if(direction == "A-Z"){
            orderDirection = "DESC";
            orderDirectionHtml = "Z-A";
        }
        else{
            orderDirection = "ASC";
            orderDirectionHtml = "A-Z";
        }
        $("#orderDirection").text(orderDirectionHtml);
    }
    func_refresh();
}
function func_search(){
    searchKey = $("#search_box").val();
    func_refresh();
}