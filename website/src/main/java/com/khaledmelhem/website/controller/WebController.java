package com.khaledmelhem.website.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA fallback controller — forwards all non-API, non-static routes
 * to index.html so React Router handles client-side navigation.
 */
@Controller
public class WebController {

    @GetMapping(value = {"/{path:^(?!api|static|assets|favicon).*}/**"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
