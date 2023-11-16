<?php

namespace Vite;

use Exception;

class Vite {

    // Singleton mode
    protected static $instance = null;

    // Components directory
    protected $components = 'components/';

    // Entry point
    protected $entry = null;

    // Entry points directory
    protected $entry_points = 'client-entry-points/';

    // Vite server
    protected $host = 'http://localhost:5133';

    protected $indent = 2;

    // Library
    protected $library = "react";

    // Manifest
    protected $manifest = null;

    // Preamble sent
    protected $preambled = false;

    // Development server running
    protected $running = null;

    public static function forge(string $entry = null, array $options = [])
    {
        // Create Vite instance, if it does not exist
        if (!static::$instance) {
            static::$instance = new static();
        }

        // Use the Vite instance
        $vite = static::$instance;

        // Set options
        $vite->set_options($options);

        // Set the entry, if provided
        if ($entry) {
            $vite->entry = $vite->entry_points . $entry;
        }

        // Return the requested entry
        return $vite->entry();
    }

    protected function set_options(array $options)
    {
        $validOptions = [
            'components', // Components directory
            'entry_points', // Entry points directory
            'host', // Vite host
            'indent', // Indentation
            'library', // Templating library/engine
        ];

        // Loop through options
        foreach ($validOptions as $option) {
            // If provided, use the provided option
            if (isset($options[$option]) && ($value = $options[$option])) {
                $this->{$option} = $value;
            }
        }

        // Check if production mode specified
        if (isset($options['production'])) {
            // In production mode, do not attempt to connect to Vite
            $this->running = !$options['production'];
        } else if (\Fuel::$env === 'production') {
            // Disable Vite by default, when environment suggests production mode
            $this->running = false;
        }
    }

    /**
     * Prints all the html entries needed to load the entry point from Vite
     * 
     * @return string
     */
	public function entry(): string
    {
        return "\n" . $this->preamble()
            . "\n" . $this->js_tag()
            . "\n" . $this->js_preload_imports()
            . "\n" . $this->css_tag();
	}

    public function indent(int $number = 0)
    {
        return implode(array_fill(0, $this->indent + $number, "\t"));
    }

    /**
     * If Vite hasn't been started it will fallback to load the production files
     * from the manifest, so the site should still function as intended (assuming that
     * the production files have been generated using `yarn build`)
     *
     * @return bool
     */
    protected function is_connected(): bool
    {
        if ($this->running === null) {
            // Request module from Vite, via cURL
            list(, $error) = $this->curl($this->host . '/' . $this->entry);
            $this->running = !$error;
        }

        return $this->running;
    }

    /**
     * Build javascript HTML tags
     * 
     * @return string
     */
    protected function js_tag(): string
    {
        if (!$this->entry) {
            return '';
        }

        $url = $this->is_connected()
            ? $this->host . '/' . $this->entry
            : $this->asset_url();
    
        if (!$url) {
            return '';
        }

        $tags = '';
        if ($this->is_connected()) {
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
        if ($this->is_connected()) {
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
                if ($this->is_connected() && !$this->preambled) {
                    // Set preambled status (preamble sent)
                    $this->preambled = true;

                    // Check if development server
                    list($response, , $info) = $this->curl("{$this->host}/@react-refresh");
                    if ($response && ($info['http_code'] === 200)) {
                        // Return preamble
                        return $this->indent() . "<script type=\"module\">\n"
                            . $this->indent(1) . "import RefreshRuntime from '{$this->host}/@react-refresh'\n"
                            . $this->indent(1) . "RefreshRuntime.injectIntoGlobalHook(window)\n"
                            . $this->indent(1) . "window.\$RefreshReg\$ = () => {}\n"
                            . $this->indent(1) . "window.\$RefreshSig\$ = () => (type) => type\n"
                            . $this->indent(1) . "window.__vite_plugin_react_preamble_installed__ = true\n"
                            . $this->indent() . "</script>\n";
                    }
                }

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
        if ($this->is_connected()) {
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
            // Attempt to load manifest
            $manifestUrl = DOCROOT . 'dist/manifest.json';
            list($content) = static::curl($manifestUrl);

            // Check for manifest response
            if ($content === false) {
                // Failed to retrieve manifest
                throw new Exception("Vite manifest ({$manifestUrl}) not found;
                    please run `yarn build`, or `yarn server`.", "404");
            }

            // Parse the manifest
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
    protected function css_urls(): array
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

    /**
     * Return the SSR (Server-side rendered) content for a given component
     * 
     * @param string $component
     * @param array $payload
     * @param string $directory
     * @return bool|string
     */
    public static function ssr(string $component, array $payload = [], array $options = [])
    {
        // Create Vite instance, if it does not exist
        if (!static::$instance) {
            static::$instance = new static();
        }

        // Use the Vite instance
        $vite = static::$instance;

        // Set options
        $vite->set_options($options);
        $vite->entry = $component;

        // URL
        $url = $vite->is_connected()
            ? $vite->host . '/ssr/' . $vite->components . $component
            : '';

        if (!$url) {
            throw new Exception("Unable to connect to Vite server, which MUST be running to serve
                SSR content; please run `yarn server`.", "404");
        }

        list($response, , $info) = static::curl($url, $payload);
        if (!$response && ($info['http_code'] === 404)) {
            throw new Exception("Vite server responded with a HTTP 404 Not Found response status
                code.  Make sure that correct server is running e.g., `yarn dev:ssr` or 
                `yarn server`.", "404");
        }
        return $response;
    }

    /**
     * Basic cURL implementation
     * Used to retrieve manifest, and interact with Vite server if running
     *
     * @param string $url
     * @param array $payload
     * @return array
     */
    protected static function curl(string $url, array $payload = []): array
    {
        $ch = curl_init($url);

        // Setup request to send JSON via POST
        if ($payload) {
            // Encode the payload as SON
            $json = json_encode($payload);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
        }

        // Return response, rather than echo
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        // Send request
        $response = curl_exec($ch);
        $error = curl_error($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);

        // Return response
        return [$response, $error, $info];
    }
}
