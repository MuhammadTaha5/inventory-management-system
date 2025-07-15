<?php
    $db_server = "localhost";
    $db_user = "root";
    $db_pass = "";
    $db_name = "ClosetInventory";
    $conn = "";
    
    try
    {
        $conn = mysqli_connect($db_server, $db_user, $db_pass, $db_name);

    }catch(mysqli_sql_exception)
    {
        echo "Not connected";
    }
    /*
    echo mysqli_num_rows($result) . "<br>";
    if (mysqli_num_rows($result)>0)
    {
        while($rows = mysqli_fetch_assoc($result))
        {
            echo $rows["id"] . "<br>";
            echo $rows["fName"] . "<br>";
            echo $rows["lName"] . "<br>";
        }
    }
        */
?>