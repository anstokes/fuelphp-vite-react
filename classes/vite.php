<?php

namespace Vite;

class Vite {

    // Entry point
    protected $entry = null;

    // Vite server
    protected $host = 'http://localhost:5133';

    protected $indent = 2;

    // Library
    protected $library = "react";

    // Manifest
    protected $manifest = null;

    // Development server running
    protected $running = null;

    public static function forge(string $entry, array $options = []) {
        $vite = new static();

        // Set entry point
        $vite->entry = $entry;

        // Check if host provided
        if (isset($options['host']) && ($host = $options['host'])) {
            // Use provided host
            $vite->host = $host;
        }

        // Check if host provided
        if (isset($options['indent']) && ($indent = $options['indent'])) {
            // Use provided host
            $vite->indent = $indent;
        }

        // Check if library provided
        if (isset($options['library']) && ($library = $options['library'])) {
            // Use provided host
            $vite->library = $library;
        }

        // Check if production mode specified
        if (isset($options['production']) && ($production = $options['production'])) {
            // Use static, rather than attempting to connect to Vite
            $vite->running = false;
        }

        return $vite->entry();
    }

    /**
     * Prints all the html entries needed to load the entry point from Vite
     * 
     * @return string
     */
	public function entry(): string {
        return "\n" . $this->preamble()
            . "\n" . $this->js_tag()
            . "\n" . $this->js_preload_imports()
            . "\n" . $this->css_tag();
	}

    public function indent(int $number = 0) {
        return implode(array_fill(0, $this->indent + $number, "\t"));
    }

    /**
     * If Vite hasn't been started it will fallback to load the production files
     * from the manifest, so the site should still function as intended
     *
     * @return bool
     */
    protected function is_dev(): bool
    {
        if ($this->running === null) {
            // Request module from Vite, via cURL
            $handle = curl_init($this->host . '/' . $this->entry);
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($handle, CURLOPT_NOBODY, true);

            curl_exec($handle);
            $error = curl_errno($handle);
            curl_close($handle);

            $this->running = !$error;
        }

        return$this->running;
    }

    /**
     * Build javascript HTML tags
     * 
     * @return string
     */
    protected function js_tag(): string
    {
        $url = $this->is_dev()
            ? $this->host . '/' . $this->entry
            : $this->asset_url();
    
        if (!$url) {
            return '';
        }

        $tags = '';
        if ($this->is_dev()) {
            // $tags .= $this->indent() . "<script type=\"module\" src=\"{$this->host}/@vite/client\"></script>\n";
        }
        return $tags . $this->indent() . "<script type=\"module\" src=\"{$url}\"></script>\n";
    }

    /**
     * Build preload HTML tags
     * 
     * @return string
     */
    protected function js_preload_imports(): string
    {
        // No preloaded imports in development mode
        if ($this->is_dev()) {
            return '';
        }
    
        $imports = '';
        foreach ($this->imports_urls() as $url) {
            $imports .= $this->indent() . "<link rel=\"modulepreload\" href=\"{$url}\" />\n";
        }
        return $imports;
    }

    protected function preamble(): string
    {
        switch ($this->library) {
            case 'react':
                if ($this->is_dev())
                return $this->indent() . "<script type=\"module\">\n"
                    . $this->indent(1) . "import RefreshRuntime from '{$this->host}/@react-refresh'\n"
                    . $this->indent(1) . "RefreshRuntime.injectIntoGlobalHook(window)\n"
                    . $this->indent(1) . "window.\$RefreshReg\$ = () => {}\n"
                    . $this->indent(1) . "window.\$RefreshSig\$ = () => (type) => type\n"
                    . $this->indent(1) . "window.__vite_plugin_react_preamble_installed__ = true\n"
                    . $this->indent() . "</script>\n";

            default:
                return '';
        }
    }
    
    /**
     * Build CSS HTML tags
     * 
     * @return string
     */
    protected function css_tag(): string
    {
        // No CSS tag in development mode, it's inject by Vite
        if ($this->is_dev()) {
            return '';
        }
    
        $tags = '';
        foreach ($this->css_urls() as $url) {
            $tags .= $this->indent() . "<link rel=\"stylesheet\" href=\"{$url}\" />\n";
        }
        return $tags;
    }
    
    /**
     * Read the Vite manifest and parse to PHP array
     * 
     * @return array
     */
    protected function get_manifest(): array
    {
        // Check if manifest has already been loaded
        if ($this->manifest === null) {
            // Load manifest
            $content = file_get_contents(DOCROOT . '/dist/manifest.json');
            $this->manifest = json_decode($content, true);
        }

        return $this->manifest;
    }

    /**
     * Return asset URL for the given entry point
     * 
     * @return string
     */
    protected function asset_url(): string
    {
        $manifest = $this->get_manifest();

        return isset($manifest[$this->entry])
            ? "/dist/{$manifest[$this->entry]['file']}"
            : '';
    }
    
    /**
     * Return import URL(s) for the given entry point
     * 
     * @return array
     */
    protected function imports_urls(): array
    {
        $manifest = $this->get_manifest();    

        $urls = [];
        if (!empty($manifest[$this->entry]['imports'])) {
            foreach ($manifest[$this->entry]['imports'] as $imports) {
                $urls[] = "/dist/{$manifest[$imports]['file']}";
            }
        }
        return $urls;
    }
    
    /**
     * Return CSS URL(s) for the given entry point
     * 
     * @return array
     */
    function css_urls(): array
    {
        $manifest = $this->get_manifest();

        $urls = [];
        if (!empty($manifest[$this->entry]['css'])) {
            foreach ($manifest[$this->entry]['css'] as $file) {
                $urls[] = '/dist/' . $file;
            }
        }
        return $urls;
    }    

}
