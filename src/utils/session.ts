import { Request } from "express";

export function updateSession(req: Request, data: any): void {
  if (req.session) {
    if (data && data !== {}) {
      req.session.submission = data;
      req.session.save(err => {
        if (err) console.error("error saving:", err);
      });
    }
  }
}

export function cleanSession(req: Request): void {
  if (req.session && req.session.submission) {
    req.session.destroy(err => {
      if (err) console.error("error while destroying session:", err);
    });
  }
}
