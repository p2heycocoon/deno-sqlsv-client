import "https://deno.land/std@0.193.0/dotenv/load.ts";
import {
  Disposable,
  using,
} from "https://deno.land/x/disposable@v1.1.1/mod.ts";

//@deno-types="npm:@types/mssql"
import mssql from "npm:mssql@9.1.1";

const conPool = new mssql.ConnectionPool({
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  server: Deno.env.get("DB_SERVER") as string,
  database: Deno.env.get("DB_DATABASE"),
  options: {
    //denoの場合、npmのtlsが使えないため false にする必要あり。 参考情報：https://github.com/denoland/deno/issues/17842
    encrypt: false,

    //これをfalseにしないと、問合せ結果の日時がUTCの問合せ結果の日時がUTCになってしまう。
    useUTC: false,
  },
});

await using(
  (await conPool.connect()) as mssql.ConnectionPool & Disposable,
  async (con) => {
    con.dispose = con.close;

    const dbReq = con.request();
    const query = `SELECT GETDATE() AS DBDATE;`;
    const rs = await dbReq.query(query);

    console.log(rs.recordset[0]["DBDATE"].constructor.name); //Date
    console.log(rs.recordset[0]["DBDATE"]); //ex: Fri Aug 11 2023 22:42:27 GMT+0900 (日本標準時)
  }
);

// //以下の様にcloseしないままだと、処理が終わってもdenoが終了しない。まだ生きているリソースがあるため。
// //それでも約20秒後にGCが何処からも参照されないリソースを破棄してくれて、denoが終了する。
// //GC任せではなく、usingを活用して確実にdisposeするのが良い。
// const con = await conPool.connect();
// const dbReq = con.request();
// const query = `SELECT GETDATE() AS DBDATE;`;
// const rs = await dbReq.query(query);

// console.log("pool rs.recordset[0]['DBDATE']): ", rs.recordset[0]["DBDATE"]);
