const fs = require('fs');
const path = require('path');

/**
 * Script de test d'intégration pour le système de bataille Pokémon MMO
 * Vérifie que tous les composants sont correctement intégrés
 */
class BattleSystemIntegrationTest {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        this.workspaceRoot = path.resolve(__dirname, '..');
    }

    /**
     * Lance tous les tests d'intégration
     */
    async runAllTests() {
        console.log('🧪 Démarrage des tests d\'intégration du système de bataille...\n');
        
        try {
            // Tests de structure de fichiers
            await this.testFileStructure();
            
            // Tests de configuration
            await this.testConfigurations();
            
            // Tests de base de données
            await this.testDatabaseIntegration();
            
            // Tests de frontend
            await this.testFrontendIntegration();
            
            // Tests de backend
            await this.testBackendIntegration();
            
            // Tests de sprites
            await this.testSpriteSystem();
            
            // Génération du rapport
            this.generateTestReport();
            
            console.log('✅ Tests d\'intégration terminés !');
            
        } catch (error) {
            console.error('💥 Erreur lors des tests :', error);
            this.errors.push(`Test failure: ${error.message}`);
        }
    }

    /**
     * Teste la structure des fichiers
     */
    async testFileStructure() {
        console.log('📁 Test de la structure des fichiers...');
        
        const requiredFiles = [
            'public/js/battle-sprite-manager.js',
            'public/js/battle-interface.js',
            'public/js/battle-animation-manager.js',
            'public/css/battle-interface.css',
            'public/css/battle-animations.css',
            'services/BattleService.js',
            'database/battle_tables.sql',
            'database/migrate-pokemon-data.js'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(this.workspaceRoot, file);
            
            if (fs.existsSync(filePath)) {
                this.addTestResult(`✅ Fichier présent: ${file}`);
            } else {
                this.addError(`❌ Fichier manquant: ${file}`);
            }
        }
        
        // Vérifier le dossier des sprites
        const spritePath = path.join(this.workspaceRoot, 'poke-battle/battle/images/animated/pokemon/battlesprites');
        if (fs.existsSync(spritePath)) {
            const spriteFiles = fs.readdirSync(spritePath).filter(f => f.endsWith('.gif'));
            this.addTestResult(`✅ Dossier sprites: ${spriteFiles.length} sprites trouvés`);
            
            if (spriteFiles.length < 10) {
                this.addWarning(`⚠️ Peu de sprites disponibles (${spriteFiles.length})`);
            }
        } else {
            this.addError('❌ Dossier sprites manquant');
        }
        
        console.log('📁 Test de structure terminé\n');
    }

    /**
     * Teste les configurations
     */
    async testConfigurations() {
        console.log('⚙️ Test des configurations...');
        
        // Vérifier les fichiers de configuration des sprites
        const configFiles = [
            'poke-battle/battle/images/animated/pokemon/battlesprites/table-front-scale.txt',
            'poke-battle/battle/images/animated/pokemon/battlesprites/table-back-scale.txt',
            'poke-battle/battle/images/animated/pokemon/battlesprites/table-coordinate-mods.txt'
        ];
        
        for (const configFile of configFiles) {
            const configPath = path.join(this.workspaceRoot, configFile);
            
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith(';'));
                    
                    this.addTestResult(`✅ Config ${path.basename(configFile)}: ${lines.length} entrées`);
                } catch (error) {
                    this.addError(`❌ Erreur lecture config ${configFile}: ${error.message}`);
                }
            } else {
                this.addError(`❌ Fichier config manquant: ${configFile}`);
            }
        }
        
        console.log('⚙️ Test des configurations terminé\n');
    }

    /**
     * Teste l'intégration de la base de données
     */
    async testDatabaseIntegration() {
        console.log('🗄️ Test d\'intégration base de données...');
        
        try {
            const { pool } = require('./migrate');
            const client = await pool.connect();
            
            try {
                // Test de connexion
                this.addTestResult('✅ Connexion base de données OK');
                
                // Vérifier les tables de bataille
                const tableCheck = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name IN ('pokemon_species', 'moves', 'pokemon', 'battles', 'battle_logs')
                `);
                
                const existingTables = tableCheck.rows.map(row => row.table_name);
                const requiredTables = ['pokemon_species', 'moves', 'pokemon', 'battles', 'battle_logs'];
                
                for (const table of requiredTables) {
                    if (existingTables.includes(table)) {
                        this.addTestResult(`✅ Table ${table} présente`);
                    } else {
                        this.addError(`❌ Table ${table} manquante`);
                    }
                }
                
                // Vérifier les données de base
                const speciesCount = await client.query('SELECT COUNT(*) FROM pokemon_species');
                const movesCount = await client.query('SELECT COUNT(*) FROM moves');
                
                this.addTestResult(`✅ Espèces Pokémon: ${speciesCount.rows[0].count}`);
                this.addTestResult(`✅ Attaques: ${movesCount.rows[0].count}`);
                
                if (parseInt(speciesCount.rows[0].count) === 0) {
                    this.addWarning('⚠️ Aucune espèce Pokémon en base - exécuter migrate-pokemon-data.js');
                }
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            this.addError(`❌ Erreur base de données: ${error.message}`);
        }
        
        console.log('🗄️ Test base de données terminé\n');
    }

    /**
     * Teste l'intégration frontend
     */
    async testFrontendIntegration() {
        console.log('🖥️ Test d\'intégration frontend...');
        
        // Vérifier l'inclusion des scripts dans index.html
        const indexPath = path.join(this.workspaceRoot, 'public/index.html');
        
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            
            const requiredScripts = [
                'battle-sprite-manager.js',
                'battle-animation-manager.js',
                'battle-interface.js'
            ];
            
            for (const script of requiredScripts) {
                if (content.includes(script)) {
                    this.addTestResult(`✅ Script ${script} inclus dans index.html`);
                } else {
                    this.addError(`❌ Script ${script} non inclus dans index.html`);
                }
            }
            
            // Vérifier les CSS
            if (content.includes('battle-interface.css') || content.includes('battle-animations.css')) {
                this.addTestResult('✅ CSS de bataille référencé');
            } else {
                this.addWarning('⚠️ CSS de bataille non référencé directement (chargement dynamique OK)');
            }
            
        } else {
            this.addError('❌ index.html manquant');
        }
        
        // Analyser les fichiers JavaScript
        this.analyzeJavaScriptFile('public/js/battle-sprite-manager.js', 'BattleSpriteManager');
        this.analyzeJavaScriptFile('public/js/battle-interface.js', 'BattleInterface');
        this.analyzeJavaScriptFile('public/js/battle-animation-manager.js', 'BattleAnimationManager');
        
        console.log('🖥️ Test frontend terminé\n');
    }

    /**
     * Teste l'intégration backend
     */
    async testBackendIntegration() {
        console.log('🔧 Test d\'intégration backend...');
        
        // Analyser BattleService
        const battleServicePath = path.join(this.workspaceRoot, 'services/BattleService.js');
        
        if (fs.existsSync(battleServicePath)) {
            const content = fs.readFileSync(battleServicePath, 'utf8');
            
            const requiredMethods = [
                'initiateBattle',
                'processMove',
                'broadcastMoveAnimation',
                'endBattle'
            ];
            
            for (const method of requiredMethods) {
                if (content.includes(method)) {
                    this.addTestResult(`✅ Méthode ${method} présente dans BattleService`);
                } else {
                    this.addError(`❌ Méthode ${method} manquante dans BattleService`);
                }
            }
            
            // Vérifier l'intégration Socket.io
            if (content.includes('socket.emit') && content.includes('battle_')) {
                this.addTestResult('✅ Événements Socket.io de bataille configurés');
            } else {
                this.addWarning('⚠️ Événements Socket.io de bataille à vérifier');
            }
            
        } else {
            this.addError('❌ BattleService.js manquant');
        }
        
        // Vérifier l'intégration dans server.js
        const serverPath = path.join(this.workspaceRoot, 'server.js');
        
        if (fs.existsSync(serverPath)) {
            const content = fs.readFileSync(serverPath, 'utf8');
            
            if (content.includes('BattleService')) {
                this.addTestResult('✅ BattleService intégré dans server.js');
            } else {
                this.addWarning('⚠️ BattleService à intégrer dans server.js');
            }
            
        } else {
            this.addError('❌ server.js manquant');
        }
        
        console.log('🔧 Test backend terminé\n');
    }

    /**
     * Teste le système de sprites
     */
    async testSpriteSystem() {
        console.log('🎨 Test du système de sprites...');
        
        const spritePath = path.join(this.workspaceRoot, 'poke-battle/battle/images/animated/pokemon/battlesprites');
        
        if (fs.existsSync(spritePath)) {
            const files = fs.readdirSync(spritePath);
            
            // Tester quelques sprites de référence
            const testSprites = [
                '001-front-n.gif',  // Bulbasaur
                '001-back-n.gif',
                '025-front-n.gif',  // Pikachu
                '025-back-n.gif'
            ];
            
            let foundSprites = 0;
            
            for (const sprite of testSprites) {
                if (files.includes(sprite)) {
                    this.addTestResult(`✅ Sprite de test ${sprite} présent`);
                    foundSprites++;
                } else {
                    this.addWarning(`⚠️ Sprite de test ${sprite} manquant`);
                }
            }
            
            if (foundSprites >= 2) {
                this.addTestResult('✅ Sprites de base disponibles pour les tests');
            } else {
                this.addError('❌ Pas assez de sprites de base pour les tests');
            }
            
            // Analyser les patterns de nommage
            const frontSprites = files.filter(f => f.includes('-front-') && f.endsWith('.gif'));
            const backSprites = files.filter(f => f.includes('-back-') && f.endsWith('.gif'));
            
            this.addTestResult(`✅ Sprites front: ${frontSprites.length}`);
            this.addTestResult(`✅ Sprites back: ${backSprites.length}`);
            
        }
        
        console.log('🎨 Test sprites terminé\n');
    }

    /**
     * Analyse un fichier JavaScript
     */
    analyzeJavaScriptFile(filePath, expectedClass) {
        const fullPath = path.join(this.workspaceRoot, filePath);
        
        if (fs.existsSync(fullPath)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                if (content.includes(`class ${expectedClass}`)) {
                    this.addTestResult(`✅ Classe ${expectedClass} définie`);
                } else {
                    this.addError(`❌ Classe ${expectedClass} non trouvée dans ${filePath}`);
                }
                
                if (content.includes('constructor')) {
                    this.addTestResult(`✅ Constructeur présent dans ${expectedClass}`);
                }
                
                // Compter les méthodes (approximatif)
                const methodCount = (content.match(/^\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/gm) || []).length;
                this.addTestResult(`✅ ${expectedClass}: ~${methodCount} méthodes détectées`);
                
            } catch (error) {
                this.addError(`❌ Erreur analyse ${filePath}: ${error.message}`);
            }
        }
    }

    /**
     * Ajoute un résultat de test
     */
    addTestResult(result) {
        this.testResults.push(result);
    }

    /**
     * Ajoute une erreur
     */
    addError(error) {
        this.errors.push(error);
        console.log(error);
    }

    /**
     * Ajoute un avertissement
     */
    addWarning(warning) {
        this.warnings.push(warning);
        console.log(warning);
    }

    /**
     * Génère le rapport de test
     */
    generateTestReport() {
        const reportPath = path.join(__dirname, 'battle_integration_test_report.txt');
        
        const report = [
            '='.repeat(80),
            'RAPPORT DE TEST D\'INTÉGRATION - SYSTÈME DE BATAILLE POKÉMON MMO',
            '='.repeat(80),
            `Date: ${new Date().toISOString()}`,
            `Total des tests: ${this.testResults.length}`,
            `Erreurs: ${this.errors.length}`,
            `Avertissements: ${this.warnings.length}`,
            '',
            'RÉSULTATS DES TESTS:',
            '-'.repeat(40),
            ...this.testResults,
            '',
            'ERREURS:',
            '-'.repeat(40),
            ...this.errors,
            '',
            'AVERTISSEMENTS:',
            '-'.repeat(40),
            ...this.warnings,
            '',
            'RÉSUMÉ:',
            '-'.repeat(40),
            this.errors.length === 0 ? '✅ TOUS LES TESTS CRITIQUES PASSÉS' : '❌ ERREURS CRITIQUES DÉTECTÉES',
            this.warnings.length === 0 ? '✅ AUCUN AVERTISSEMENT' : `⚠️ ${this.warnings.length} AVERTISSEMENT(S)`,
            '',
            'PROCHAINES ÉTAPES:',
            '-'.repeat(40),
            this.errors.length > 0 ? '1. Corriger les erreurs critiques listées ci-dessus' : '1. ✅ Tous les composants critiques sont présents',
            this.warnings.length > 0 ? '2. Examiner et résoudre les avertissements si nécessaire' : '2. ✅ Aucun avertissement à traiter',
            '3. Effectuer des tests manuels du système de bataille',
            '4. Optimiser les performances si nécessaire',
            '5. Déployer en production',
            '',
            '='.repeat(80)
        ].join('\n');
        
        fs.writeFileSync(reportPath, report);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSUMÉ DU TEST D\'INTÉGRATION');
        console.log('='.repeat(60));
        console.log(`✅ Tests réussis: ${this.testResults.length}`);
        console.log(`❌ Erreurs: ${this.errors.length}`);
        console.log(`⚠️ Avertissements: ${this.warnings.length}`);
        
        if (this.errors.length === 0) {
            console.log('\n🎉 INTÉGRATION RÉUSSIE ! Le système de bataille est prêt.');
        } else {
            console.log('\n⚠️ INTÉGRATION INCOMPLÈTE - Voir les erreurs ci-dessus.');
        }
        
        console.log(`\n📄 Rapport détaillé: ${reportPath}`);
    }

    /**
     * Teste les performances (test basique)
     */
    async testPerformance() {
        console.log('🏃 Test de performance basique...');
        
        // Test de chargement des sprites (simulation)
        const start = Date.now();
        
        // Simuler le chargement de plusieurs sprites
        for (let i = 0; i < 10; i++) {
            // Simulation d'opération asynchrone
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const elapsed = Date.now() - start;
        
        if (elapsed < 500) {
            this.addTestResult(`✅ Performance simulée: ${elapsed}ms (Bon)`);
        } else {
            this.addWarning(`⚠️ Performance simulée: ${elapsed}ms (À optimiser)`);
        }
        
        console.log('🏃 Test de performance terminé\n');
    }
}

// Fonction principale
async function main() {
    const tester = new BattleSystemIntegrationTest();
    await tester.runAllTests();
    
    // Code de sortie basé sur les résultats
    process.exit(tester.errors.length > 0 ? 1 : 0);
}

// Exporter et exécuter si appelé directement
module.exports = BattleSystemIntegrationTest;

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Erreur fatale lors des tests:', error);
        process.exit(1);
    });
}