/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_ENV: "development" | "production";
  readonly VITE_DEV_BASE_URL: string;
  readonly VITE_PROD_BASE_URL: string;

  readonly VITE_AUTH_LOGIN_ROUTE: string;
  readonly VITE_AUTH_LOGOUT_ROUTE: string;
  readonly VITE_DEPARTMENTS_ROUTE: string;
  readonly VITE_CHARTERS_ROUTE: string;
  readonly VITE_EDITED_CHARTERS_ROUTE: string;
  readonly VITE_RATINGS_ROUTE: string;
  readonly VITE_FEEDBACK_ROUTE: string;
  readonly VITE_ADMIN_ROUTE: string;
  readonly VITE_ADMIN_DASHBOARD_ROUTE: string;
  readonly VITE_ADMIN_DEPARTMENTS_ROUTE: string;
  readonly VITE_ADMIN_CHARTERS_ROUTE: string;
  readonly VITE_ADMIN_EDITED_CHARTERS_ROUTE: string;
  readonly VITE_ADMIN_FEEDBACK_ROUTE: string;
  readonly VITE_ADMIN_BACKUP_ROUTE: string;
  readonly VITE_HOME_ROUTE: string;

  readonly VITE_GSHEETS_API_KEY: string;
  readonly VITE_GSHEETS_SPREADSHEET_ID: string;
  readonly VITE_GSHEETS_SHEET_NAME: string;
  readonly VITE_GSHEETS_RANGE: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
